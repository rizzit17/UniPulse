package com.unipulse.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.Department;
import com.unipulse.core.department.repo.CategoryRepository;
import com.unipulse.core.department.repo.DepartmentRepository;
import com.unipulse.core.request.api.RequestDtos;
import com.unipulse.core.request.domain.ServiceRequest;
import com.unipulse.core.request.repo.ServiceRequestRepository;
import com.unipulse.core.auth.service.JwtTokenProvider;
import com.unipulse.core.user.domain.User;
import com.unipulse.common.model.UserRole;
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

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RequestConcurrencyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ServiceRequestRepository requestRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String techToken;
    private String adminToken;
    private UUID techId;
    private Category category;

    @BeforeEach
    void setUp() {
        requestRepository.deleteAll();
        categoryRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();

        User techUser = User.builder()
                .id(UUID.randomUUID())
                .email("tech.concurrency@unipulse.edu")
                .passwordHash("hash")
                .fullName("Concurrency Tech")
                .role(UserRole.TECHNICIAN)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(techUser);
        techId = techUser.getId();

        User adminUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin.concurrency@unipulse.edu")
                .passwordHash("hash")
                .fullName("Concurrency Admin")
                .role(UserRole.ADMIN)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(adminUser);

        techToken = jwtTokenProvider.generateAccessToken(techUser.getId(), techUser.getEmail(), techUser.getRole(), techUser.getCampusId());
        adminToken = jwtTokenProvider.generateAccessToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole(), adminUser.getCampusId());

        Department department = Department.builder()
                .id(UUID.randomUUID())
                .name("Campus Maintenance")
                .build();
        departmentRepository.save(department);

        category = Category.builder()
                .id(UUID.randomUUID())
                .name("HVAC")
                .departmentId(department.getId())
                .defaultPriority(RequestPriority.P1)
                .build();
        categoryRepository.save(category);
    }

    @Test
    @DisplayName("Optimistic locking: 50 concurrent threads racing on the same request version results in exactly 1 success and 49 conflicts (409)")
    void shouldHandle50ConcurrentUpdatesWithOptimisticLocking() throws Exception {
        // 1. Create a request (version 0, status OPEN)
        RequestDtos.CreateRequestRequest createReq = new RequestDtos.CreateRequestRequest(
                "Burst pipe flooding laboratory floor",
                "Water leak creating emergency in Chemical Lab 301.",
                category.getId(),
                "Chemistry Block",
                "Lab 301"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        RequestDtos.RequestResponse created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );
        UUID requestId = created.id();

        // 2. Assign to technician (version bumps to 1, status ASSIGNED)
        MvcResult assignResult = mockMvc.perform(put("/api/v1/requests/" + requestId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .header(HttpHeaders.IF_MATCH, "\"" + created.version() + "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestDtos.AssignRequest(techId, created.version()))))
                .andExpect(status().isOk())
                .andReturn();

        RequestDtos.RequestResponse assigned = objectMapper.readValue(
                assignResult.getResponse().getContentAsString(),
                RequestDtos.RequestResponse.class
        );
        long targetVersion = assigned.version(); // 1

        // 3. Prepare 50 concurrent threads to transition to IN_PROGRESS simultaneously with targetVersion = 1
        int threadCount = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        AtomicInteger unexpectedCount = new AtomicInteger(0);

        RequestDtos.TransitionStatusRequest transitionReq = new RequestDtos.TransitionStatusRequest(
                RequestStatus.IN_PROGRESS,
                "Technician started troubleshooting",
                targetVersion
        );
        String requestJson = objectMapper.writeValueAsString(transitionReq);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startSignal.await(); // wait for gun shot
                    MvcResult res = mockMvc.perform(put("/api/v1/requests/" + requestId + "/status")
                                    .header("Authorization", "Bearer " + techToken)
                                    .header(HttpHeaders.IF_MATCH, "\"" + targetVersion + "\"")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(requestJson))
                            .andReturn();

                    int statusCode = res.getResponse().getStatus();
                    if (statusCode == 200) {
                        successCount.incrementAndGet();
                    } else if (statusCode == 409) {
                        conflictCount.incrementAndGet();
                    } else {
                        unexpectedCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    unexpectedCount.incrementAndGet();
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        // Fire all threads simultaneously
        startSignal.countDown();
        boolean completed = doneSignal.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(unexpectedCount.get()).as("Unexpected response status codes").isEqualTo(0);
        assertThat(successCount.get()).as("Exactly one update succeeds").isEqualTo(1);
        assertThat(conflictCount.get()).as("All concurrent attempts fail with 409 Conflict").isEqualTo(49);

        // Verify final state in database: status IN_PROGRESS, version = 2
        ServiceRequest finalRequest = requestRepository.findById(requestId).orElseThrow();
        assertThat(finalRequest.getStatus()).isEqualTo(RequestStatus.IN_PROGRESS);
        assertThat(finalRequest.getVersion()).isEqualTo(targetVersion + 1);
    }
}
