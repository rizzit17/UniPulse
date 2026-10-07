package com.unipulse.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.error.ErrorCodes;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.auth.service.JwtTokenProvider;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.Department;
import com.unipulse.core.department.domain.SlaPolicy;
import com.unipulse.core.department.repo.CategoryRepository;
import com.unipulse.core.department.repo.DepartmentRepository;
import com.unipulse.core.department.repo.SlaPolicyRepository;
import com.unipulse.core.request.api.RequestDtos;
import com.unipulse.core.request.domain.OutboxEvent;
import com.unipulse.core.request.repo.OutboxEventRepository;
import com.unipulse.core.request.repo.RequestCommentRepository;
import com.unipulse.core.request.repo.RequestHistoryRepository;
import com.unipulse.core.request.repo.ServiceRequestRepository;
import com.unipulse.core.user.domain.User;
import com.unipulse.core.user.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RequestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ServiceRequestRepository requestRepository;

    @Autowired
    private RequestHistoryRepository historyRepository;

    @Autowired
    private RequestCommentRepository commentRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SlaPolicyRepository slaPolicyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User studentUser;
    private User techUser;
    private User adminUser;
    private String studentToken;
    private String techToken;
    private String adminToken;
    private Category category;
    private Department department;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        historyRepository.deleteAll();
        requestRepository.deleteAll();
        outboxEventRepository.deleteAll();
        categoryRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();

        // Ensure SLA policies exist
        for (RequestPriority p : RequestPriority.values()) {
            slaPolicyRepository.save(SlaPolicy.builder()
                    .priority(p)
                    .respondMinutes(p.getDefaultRespondMinutes())
                    .resolveMinutes(p.getDefaultResolveMinutes())
                    .build());
        }

        // Setup users
        studentUser = User.builder()
                .id(UUID.randomUUID())
                .email("student.aarav@unipulse.edu")
                .passwordHash("hash")
                .fullName("Aarav Sharma")
                .role(UserRole.REQUESTER)
                .active(true)
                .build();
        userRepository.save(studentUser);

        techUser = User.builder()
                .id(UUID.randomUUID())
                .email("tech.dev@unipulse.edu")
                .passwordHash("hash")
                .fullName("Dev Anand")
                .role(UserRole.TECHNICIAN)
                .active(true)
                .build();
        userRepository.save(techUser);

        adminUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin.super@unipulse.edu")
                .passwordHash("hash")
                .fullName("Super Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();
        userRepository.save(adminUser);

        studentToken = jwtTokenProvider.generateAccessToken(studentUser.getId(), studentUser.getEmail(), studentUser.getRole(), studentUser.getCampusId());
        techToken = jwtTokenProvider.generateAccessToken(techUser.getId(), techUser.getEmail(), techUser.getRole(), techUser.getCampusId());
        adminToken = jwtTokenProvider.generateAccessToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole(), adminUser.getCampusId());

        // Setup department and category
        department = Department.builder()
                .id(UUID.randomUUID())
                .name("Campus Maintenance")
                .build();
        departmentRepository.save(department);

        category = Category.builder()
                .id(UUID.randomUUID())
                .name("Air Conditioning")
                .departmentId(department.getId())
                .defaultPriority(RequestPriority.P1)
                .build();
        categoryRepository.save(category);
    }

    @Test
    @DisplayName("FR-REQ-1: Create request generates public ID, calculates SLA, checks duplicates, and writes outbox")
    void shouldCreateRequestAndPreventDuplicates() throws Exception {
        RequestDtos.CreateRequestRequest req = new RequestDtos.CreateRequestRequest(
                "AC leaking water in Room 204",
                "The indoor AC unit has been leaking water onto study desks since morning.",
                category.getId(),
                "Block C",
                "204"
        );

        // 1. Creation succeeds with 201 Created
        MvcResult result = mockMvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(jsonPath("$.publicId").value(org.hamcrest.Matchers.matchesPattern("^UP-\\d{4}-\\d{6}$")))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.priority").value("P1"))
                .andReturn();

        RequestDtos.RequestResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // Verify outbox entry
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        assertThat(outboxEvents).hasSize(1);
        assertThat(outboxEvents.get(0).getType()).isEqualTo("RequestCreated");

        // 2. Duplicate submission within 30 min window returns 409 DUPLICATE_REQUEST
        mockMvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCodes.DUPLICATE_REQUEST));
    }

    @Test
    @DisplayName("FR-REQ-2 & FR-REQ-3: Full lifecycle, optimistic locking, and SLA pause on hold")
    void shouldHandleLifecycleAndOptimisticLocking() throws Exception {
        RequestDtos.CreateRequestRequest createReq = new RequestDtos.CreateRequestRequest(
                "Power socket spark issue",
                "Socket sparked when laptop charger was plugged in. Burning smell noticed.",
                category.getId(),
                "Hostel 4",
                "102"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        RequestDtos.RequestResponse created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );
        UUID reqId = created.id();

        // 1. Illegal transition directly from OPEN to RESOLVED -> 409 ILLEGAL_TRANSITION
        RequestDtos.TransitionStatusRequest badTransition = new RequestDtos.TransitionStatusRequest(
                RequestStatus.RESOLVED,
                "Fixed prematurely",
                created.version()
        );
        mockMvc.perform(put("/api/v1/requests/" + reqId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + created.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badTransition)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCodes.ILLEGAL_TRANSITION));

        // 2. Stale version check with wrong If-Match -> 409 STALE_VERSION
        RequestDtos.AssignRequest assignReq = new RequestDtos.AssignRequest(techUser.getId(), 999L);
        mockMvc.perform(put("/api/v1/requests/" + reqId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .header(HttpHeaders.IF_MATCH, "\"999\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCodes.STALE_VERSION));

        // 3. Assign technician -> ASSIGNED (version 0 -> 1)
        MvcResult assignResult = mockMvc.perform(put("/api/v1/requests/" + reqId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + created.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.AssignRequest(techUser.getId(), created.version()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.assigneeId").value(techUser.getId().toString()))
                .andReturn();

        RequestDtos.RequestResponse assigned = objectMapper.readValue(
                assignResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // 4. Technician marks IN_PROGRESS
        MvcResult inProgResult = mockMvc.perform(put("/api/v1/requests/" + reqId + "/status")
                        .header("Authorization", "Bearer " + techToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + assigned.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.TransitionStatusRequest(
                                RequestStatus.IN_PROGRESS,
                                "Arrived on site",
                                assigned.version()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andReturn();

        RequestDtos.RequestResponse inProgress = objectMapper.readValue(
                inProgResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // 5. Technician puts ON_HOLD (waiting for spare parts) -> SLA pauses
        MvcResult holdResult = mockMvc.perform(put("/api/v1/requests/" + reqId + "/status")
                        .header("Authorization", "Bearer " + techToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + inProgress.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.TransitionStatusRequest(
                                RequestStatus.ON_HOLD,
                                "Need replacement socket board",
                                inProgress.version()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ON_HOLD"))
                .andExpect(jsonPath("$.slaPausedAt").isNotEmpty())
                .andReturn();

        RequestDtos.RequestResponse onHold = objectMapper.readValue(
                holdResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // 6. Resume to IN_PROGRESS -> SLA clock resumed
        MvcResult resumeResult = mockMvc.perform(put("/api/v1/requests/" + reqId + "/status")
                        .header("Authorization", "Bearer " + techToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + onHold.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.TransitionStatusRequest(
                                RequestStatus.IN_PROGRESS,
                                "Received parts, resuming work",
                                onHold.version()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.slaPausedAt").isEmpty())
                .andReturn();

        RequestDtos.RequestResponse resumed = objectMapper.readValue(
                resumeResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // 7. Technician resolves -> RESOLVED
        MvcResult resolveResult = mockMvc.perform(put("/api/v1/requests/" + reqId + "/status")
                        .header("Authorization", "Bearer " + techToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + resumed.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.TransitionStatusRequest(
                                RequestStatus.RESOLVED,
                                "Replaced faulty socket and verified grounding",
                                resumed.version()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty())
                .andReturn();

        RequestDtos.RequestResponse resolved = objectMapper.readValue(
                resolveResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // 8. Requester submits rating (5 stars)
        MvcResult rateResult = mockMvc.perform(post("/api/v1/requests/" + reqId + "/rate")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.RateRequest(5, "Very fast and polite service!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.ratingComment").value("Very fast and polite service!"))
                .andReturn();

        RequestDtos.RequestResponse rated = objectMapper.readValue(
                rateResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );

        // 9. Requester confirms and closes -> CLOSED
        mockMvc.perform(put("/api/v1/requests/" + reqId + "/status")
                        .header("Authorization", "Bearer " + studentToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + rated.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.TransitionStatusRequest(
                                RequestStatus.CLOSED,
                                "Confirmed working properly",
                                rated.version()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        // 10. Audit history includes all recorded steps
        mockMvc.perform(get("/api/v1/requests/" + reqId + "/history")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].field").value("status"))
                .andExpect(jsonPath("$[0].newValue").value("OPEN"));
    }

    @Test
    @DisplayName("FR-REQ-4: Comments visibility - internal comments are hidden from requesters")
    void shouldFilterInternalCommentsFromRequesters() throws Exception {
        RequestDtos.CreateRequestRequest createReq = new RequestDtos.CreateRequestRequest(
                "Leaking water pipe in hallway",
                "Water dripping from ceiling onto corridor floor creating slipping hazard.",
                category.getId(),
                "Science Block",
                "Corridor 3"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        RequestDtos.RequestResponse created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );
        UUID reqId = created.id();

        // 1. Student adds public comment
        mockMvc.perform(post("/api/v1/requests/" + reqId + "/comments")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.AddCommentRequest(
                                "Placed a bucket underneath the leak.",
                                false
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.internal").value(false));

        // 2. Student cannot add internal comment -> 403 Forbidden
        mockMvc.perform(post("/api/v1/requests/" + reqId + "/comments")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.AddCommentRequest(
                                "Trying to post internal note",
                                true
                        ))))
                .andExpect(status().isForbidden());

        // 3. Technician adds internal comment
        mockMvc.perform(post("/api/v1/requests/" + reqId + "/comments")
                        .header("Authorization", "Bearer " + techToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.AddCommentRequest(
                                "Internal note: main valve might need replacement. Notifying supervisor.",
                                true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.internal").value(true));

        // 4. Student queries comments -> sees ONLY 1 public comment
        mockMvc.perform(get("/api/v1/requests/" + reqId + "/comments")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].internal").value(false));

        // 5. Technician queries comments -> sees BOTH comments (public + internal)
        mockMvc.perform(get("/api/v1/requests/" + reqId + "/comments")
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}
