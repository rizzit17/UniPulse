package com.unipulse.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.auth.service.JwtTokenProvider;
import com.unipulse.core.department.api.DepartmentDtos;
import com.unipulse.core.department.repo.CategoryRepository;
import com.unipulse.core.department.repo.DepartmentRepository;
import com.unipulse.core.department.repo.TechnicianProfileRepository;
import com.unipulse.core.user.domain.User;
import com.unipulse.core.user.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DepartmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TechnicianProfileRepository technicianProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String requesterToken;
    private UUID adminUserId;

    @BeforeEach
    void setUp() {
        categoryRepository.deleteAll();
        departmentRepository.deleteAll();
        technicianProfileRepository.deleteAll();
        userRepository.deleteAll();

        adminUserId = UUID.randomUUID();
        User adminUser = User.builder()
                .id(adminUserId)
                .email("admin@unipulse.edu")
                .passwordHash("hash")
                .fullName("System Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();
        userRepository.save(adminUser);

        User requesterUser = User.builder()
                .id(UUID.randomUUID())
                .email("student@unipulse.edu")
                .passwordHash("hash")
                .fullName("Student User")
                .role(UserRole.REQUESTER)
                .active(true)
                .build();
        userRepository.save(requesterUser);

        adminToken = jwtTokenProvider.generateAccessToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole(), adminUser.getCampusId());
        requesterToken = jwtTokenProvider.generateAccessToken(requesterUser.getId(), requesterUser.getEmail(), requesterUser.getRole(), requesterUser.getCampusId());
    }

    @Test
    @DisplayName("Admin can create department and users can retrieve it publicly")
    void shouldCreateAndRetrieveDepartment() throws Exception {
        // 1. Unauthenticated creation should fail with 401
        DepartmentDtos.CreateDepartmentRequest deptReq = new DepartmentDtos.CreateDepartmentRequest("IT Services", adminUserId);
        mockMvc.perform(post("/api/v1/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deptReq)))
                .andExpect(status().isUnauthorized());

        // 2. Requester creation should fail with 403 Forbidden
        mockMvc.perform(post("/api/v1/departments")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deptReq)))
                .andExpect(status().isForbidden());

        // 3. Admin creation should succeed with 201 Created
        MvcResult result = mockMvc.perform(post("/api/v1/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deptReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("IT Services"))
                .andReturn();

        DepartmentDtos.DepartmentResponse dept = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                DepartmentDtos.DepartmentResponse.class
        );

        // 4. Public GET departments should return the created department
        mockMvc.perform(get("/api/v1/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(dept.id().toString()))
                .andExpect(jsonPath("$[0].name").value("IT Services"));
    }

    @Test
    @DisplayName("Admin can create category and filter categories by department ID")
    void shouldCreateAndFilterCategories() throws Exception {
        // Create department
        DepartmentDtos.CreateDepartmentRequest deptReq = new DepartmentDtos.CreateDepartmentRequest("Estate & Facilities", null);
        MvcResult deptResult = mockMvc.perform(post("/api/v1/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deptReq)))
                .andExpect(status().isCreated())
                .andReturn();

        DepartmentDtos.DepartmentResponse dept = objectMapper.readValue(
                deptResult.getResponse().getContentAsString(),
                DepartmentDtos.DepartmentResponse.class
        );

        // Create category
        DepartmentDtos.CreateCategoryRequest catReq = new DepartmentDtos.CreateCategoryRequest(
                "HVAC Repair",
                dept.id(),
                RequestPriority.P1
        );

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("HVAC Repair"))
                .andExpect(jsonPath("$.defaultPriority").value("P1"));

        // Filter categories by departmentId
        mockMvc.perform(get("/api/v1/categories").param("departmentId", dept.id().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("HVAC Repair"));
    }

    @Test
    @DisplayName("Can upsert and retrieve technician profile")
    void shouldUpsertAndGetTechnicianProfile() throws Exception {
        UUID techUserId = UUID.randomUUID();
        User tech = User.builder()
                .id(techUserId)
                .email("tech.bob@unipulse.edu")
                .passwordHash("hash")
                .fullName("Bob Miller")
                .role(UserRole.TECHNICIAN)
                .active(true)
                .build();
        userRepository.save(tech);

        String techToken = jwtTokenProvider.generateAccessToken(tech.getId(), tech.getEmail(), tech.getRole(), tech.getCampusId());

        DepartmentDtos.UpsertTechnicianProfileRequest profileReq = new DepartmentDtos.UpsertTechnicianProfileRequest(
                List.of("HVAC", "Plumbing"),
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                6
        );

        mockMvc.perform(put("/api/v1/technicians/" + techUserId + "/profile")
                        .header("Authorization", "Bearer " + techToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(techUserId.toString()))
                .andExpect(jsonPath("$.skills[0]").value("HVAC"))
                .andExpect(jsonPath("$.maxActive").value(6));

        mockMvc.perform(get("/api/v1/technicians/" + techUserId + "/profile")
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxActive").value(6));
    }
}
