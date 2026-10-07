package com.unipulse.core.shared.seed;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.core.department.domain.Category;
import com.unipulse.core.department.domain.Department;
import com.unipulse.core.department.domain.TechnicianProfile;
import com.unipulse.core.department.repo.CategoryRepository;
import com.unipulse.core.department.repo.DepartmentRepository;
import com.unipulse.core.department.repo.TechnicianProfileRepository;
import com.unipulse.core.request.domain.OutboxEvent;
import com.unipulse.core.request.domain.ServiceRequest;
import com.unipulse.core.request.repo.OutboxEventRepository;
import com.unipulse.core.request.repo.ServiceRequestRepository;
import com.unipulse.core.request.service.PublicIdGenerator;
import com.unipulse.core.user.domain.User;
import com.unipulse.common.model.UserRole;
import com.unipulse.core.user.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@Profile("!test")
@ConditionalOnProperty(prefix = "unipulse.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;
    private final TechnicianProfileRepository technicianProfileRepository;
    private final ServiceRequestRepository requestRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final PublicIdGenerator publicIdGenerator;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (departmentRepository.count() > 0) {
            log.info("Database already contains seed data, skipping seeder.");
            return;
        }

        log.info("Seeding initial UniPulse development dataset...");
        String commonPasswordHash = passwordEncoder.encode("password123");

        // 1. Core Users
        User admin = User.builder()
                .id(UUID.randomUUID())
                .email("admin@unipulse.edu")
                .passwordHash(commonPasswordHash)
                .fullName("System Administrator")
                .role(UserRole.ADMIN)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(admin);

        User faculty = User.builder()
                .id(UUID.randomUUID())
                .email("faculty.wright@unipulse.edu")
                .passwordHash(commonPasswordHash)
                .fullName("Prof. Arthur Wright")
                .role(UserRole.FACULTY)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(faculty);

        User student1 = User.builder()
                .id(UUID.randomUUID())
                .email("student.alex@unipulse.edu")
                .passwordHash(commonPasswordHash)
                .fullName("Alex Rivera")
                .role(UserRole.STUDENT)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(student1);

        User student2 = User.builder()
                .id(UUID.randomUUID())
                .email("student.jordan@unipulse.edu")
                .passwordHash(commonPasswordHash)
                .fullName("Jordan Lee")
                .role(UserRole.STUDENT)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(student2);

        // 2. Departments (4)
        Department facilities = Department.builder()
                .id(UUID.randomUUID())
                .name("Facilities & Maintenance")
                .code("FACILITIES")
                .description("Campus buildings, electrical, HVAC, and civil works")
                .isActive(true)
                .build();
        Department it = Department.builder()
                .id(UUID.randomUUID())
                .name("IT & Network Infrastructure")
                .code("IT")
                .description("Campus Wi-Fi, computer labs, AV, and networking")
                .isActive(true)
                .build();
        Department housing = Department.builder()
                .id(UUID.randomUUID())
                .name("Residential & Housing")
                .code("HOUSING")
                .description("Dormitories, residential furniture, pest control, and keys")
                .isActive(true)
                .build();
        Department security = Department.builder()
                .id(UUID.randomUUID())
                .name("Campus Safety & Security")
                .code("SECURITY")
                .description("Access turnstiles, CCTV surveillance, and fire safety systems")
                .isActive(true)
                .build();
        departmentRepository.saveAll(List.of(facilities, it, housing, security));

        // 3. Categories (12 - 3 per department)
        Category cAc = createCat("HVAC & Climate Control", facilities.getId(), RequestPriority.P2, 24);
        Category cPlumb = createCat("Plumbing & Water Supply", facilities.getId(), RequestPriority.P1, 12);
        Category cElec = createCat("Electrical Infrastructure", facilities.getId(), RequestPriority.P1, 6);

        Category cWifi = createCat("Campus Wi-Fi & LAN", it.getId(), RequestPriority.P2, 8);
        Category cAv = createCat("Smart Classroom AV & Projectors", it.getId(), RequestPriority.P2, 12);
        Category cLab = createCat("Computer Labs & Workstations", it.getId(), RequestPriority.P3, 24);

        Category cFurn = createCat("Furniture & Carpentry", housing.getId(), RequestPriority.P3, 48);
        Category cPest = createCat("Pest Control & Sanitation", housing.getId(), RequestPriority.P3, 36);
        Category cKey = createCat("Door Locks & Key Services", housing.getId(), RequestPriority.P2, 12);

        Category cAccess = createCat("Access Turnstiles & Readers", security.getId(), RequestPriority.P1, 4);
        Category cCctv = createCat("CCTV Surveillance", security.getId(), RequestPriority.P2, 12);
        Category cFire = createCat("Fire Alarms & Safety Equipment", security.getId(), RequestPriority.P1, 2);

        categoryRepository.saveAll(List.of(cAc, cPlumb, cElec, cWifi, cAv, cLab, cFurn, cPest, cKey, cAccess, cCctv, cFire));

        // 4. Technicians (8) with profiles
        List<User> technicians = new ArrayList<>();
        technicians.add(createTech("Marcus Vance", "tech.marcus@unipulse.edu", commonPasswordHash, facilities.getId(),
                List.of("HVAC", "Electrical"), "MORNING", 6, 2));
        technicians.add(createTech("Elena Rostova", "tech.elena@unipulse.edu", commonPasswordHash, facilities.getId(),
                List.of("Plumbing", "Sanitation"), "EVENING", 5, 1));

        technicians.add(createTech("Raj Patel", "tech.raj@unipulse.edu", commonPasswordHash, it.getId(),
                List.of("Networking", "Wi-Fi", "Switches"), "MORNING", 8, 3));
        technicians.add(createTech("Sarah Jenkins", "tech.sarah@unipulse.edu", commonPasswordHash, it.getId(),
                List.of("AV Systems", "Hardware", "Projectors"), "EVENING", 5, 1));

        technicians.add(createTech("David Kim", "tech.david@unipulse.edu", commonPasswordHash, housing.getId(),
                List.of("Carpentry", "Furniture", "Locks"), "MORNING", 6, 1));
        technicians.add(createTech("Priya Sharma", "tech.priya@unipulse.edu", commonPasswordHash, housing.getId(),
                List.of("Pest Control", "Sanitation"), "NIGHT", 4, 1));

        technicians.add(createTech("Alex Mercer", "tech.alex@unipulse.edu", commonPasswordHash, security.getId(),
                List.of("Access Control", "Turnstiles"), "MORNING", 5, 2));
        technicians.add(createTech("Fatima Al-Hassan", "tech.fatima@unipulse.edu", commonPasswordHash, security.getId(),
                List.of("Fire Safety", "CCTV", "Emergency"), "NIGHT", 6, 1));

        // 5. Initial Service Requests (20) in various states
        Instant now = Instant.now();

        // 5 OPEN
        createRequest("Leaking faucet in Chemistry bathroom", "Continuous water drip from sink 3", cPlumb, facilities.getId(), student1.getId(), "Chemistry Block", "104", RequestStatus.OPEN, null, null, null, null, null, now);
        createRequest("Projector flickering in Auditorium A", "HDMI input loses signal periodically during lectures", cAv, it.getId(), faculty.getId(), "Main Auditorium", "A", RequestStatus.OPEN, null, null, null, null, null, now);
        createRequest("Broken chair leg in Study Room 3", "Wooden chair has splintered leg, unseated", cFurn, housing.getId(), student2.getId(), "Hostel Tower 1", "Study 3", RequestStatus.OPEN, null, null, null, null, null, now);
        createRequest("Main library north turnstile stuck", "Card reader does not trigger barrier release", cAccess, security.getId(), student1.getId(), "Central Library", "Turnstile 2", RequestStatus.OPEN, null, null, null, null, null, now);
        createRequest("Lab 402 PC 12 blue screen loop", "Workstation fails to boot past system kernel panic", cLab, it.getId(), faculty.getId(), "Computer Center", "Lab 402", RequestStatus.OPEN, null, null, null, null, null, now);

        // 4 ASSIGNED
        createRequest("AC unit vibrating noisily in Lecture Hall B", "Excessive fan noise prevents clear audio", cAc, facilities.getId(), faculty.getId(), "Science Block", "Hall B", RequestStatus.ASSIGNED, technicians.get(0).getId(), null, null, null, null, now);
        createRequest("Hostel 2 room 214 lock jamming", "Key cannot turn full 360 degrees without force", cKey, housing.getId(), student1.getId(), "Hostel Tower 2", "214", RequestStatus.ASSIGNED, technicians.get(4).getId(), null, null, null, null, now);
        createRequest("Wi-Fi dropouts on Engineering 3rd floor", "Access point AP-ENG-302 experiencing 90% packet loss", cWifi, it.getId(), student2.getId(), "Engineering Block", "3F East", RequestStatus.ASSIGNED, technicians.get(2).getId(), null, null, null, null, now);
        createRequest("CCTV feed offline at West Gate", "Camera CAM-W-04 video signal lost since 08:00", cCctv, security.getId(), faculty.getId(), "West Gate Perimeter", "Gatehouse", RequestStatus.ASSIGNED, technicians.get(7).getId(), null, null, null, null, now);

        // 4 IN_PROGRESS
        createRequest("Short circuit in Robotics workshop bench 4", "Circuit breaker trips immediately when switched on", cElec, facilities.getId(), faculty.getId(), "Innovation Hub", "Bench 4", RequestStatus.IN_PROGRESS, technicians.get(0).getId(), null, null, null, null, now);
        createRequest("Ant infestation in Hostel 1 common pantry", "Noticeable ant trails around food preparation area", cPest, housing.getId(), student2.getId(), "Hostel Tower 1", "Pantry 2F", RequestStatus.IN_PROGRESS, technicians.get(5).getId(), null, null, null, null, now);
        createRequest("Ethernet port dead at Faculty Desk 18", "No link light detected on Cat6 patch cable", cWifi, it.getId(), faculty.getId(), "Admin Building", "Room 312", RequestStatus.IN_PROGRESS, technicians.get(2).getId(), null, null, null, null, now);
        createRequest("Access badge scanner offline at Physics Lab", "Scanner beeps red for all authorized RFID badges", cAccess, security.getId(), student1.getId(), "Physics Complex", "Lab 101", RequestStatus.IN_PROGRESS, technicians.get(6).getId(), null, null, null, null, now);

        // 2 ON_HOLD
        createRequest("Central chiller refrigerant valve replacement", "Compressor valve cracked. Part ordered from supplier ETA 48h", cAc, facilities.getId(), faculty.getId(), "Utility Complex", "Chiller Plant", RequestStatus.ON_HOLD, technicians.get(0).getId(), now.minus(4, ChronoUnit.HOURS), null, null, null, now);
        createRequest("Emergency exit door magnetic lock malfunction", "Replacement armature plate required for door ED-2", cFire, security.getId(), admin.getId(), "Central Library", "East Exit", RequestStatus.ON_HOLD, technicians.get(7).getId(), now.minus(2, ChronoUnit.HOURS), null, null, null, now);

        // 3 RESOLVED
        createRequest("Water overflow in 2nd floor restrooms", "Float valve adjusted and drain pipe unclogged", cPlumb, facilities.getId(), student2.getId(), "Student Union", "2F Restroom", RequestStatus.RESOLVED, technicians.get(1).getId(), null, now.minus(12, ChronoUnit.HOURS), 5, "Fixed rapidly before event started!", now);
        createRequest("Switch port VLAN misconfiguration", "Port re-tagged to Student VLAN 104 with DHCP verified", cWifi, it.getId(), faculty.getId(), "Mathematics Hall", "Room 201", RequestStatus.RESOLVED, technicians.get(2).getId(), null, now.minus(6, ChronoUnit.HOURS), 4, "Working smoothly now", now);
        createRequest("Fire extinguisher inspection tag expired", "New hydrostatic test tag mounted and checked", cFire, security.getId(), admin.getId(), "Design Building", "Hallway 1F", RequestStatus.RESOLVED, technicians.get(7).getId(), null, now.minus(1, ChronoUnit.HOURS), null, null, now);

        // 2 CLOSED
        createRequest("Ceiling fan not spinning in Classroom 108", "Capacitor replaced and speed controller calibrated", cElec, facilities.getId(), student1.getId(), "Arts Block", "108", RequestStatus.CLOSED, technicians.get(0).getId(), null, now.minus(72, ChronoUnit.HOURS), 5, "Excellent turnaround time", now.minus(48, ChronoUnit.HOURS));
        createRequest("Window latch broken in Dorm 304", "Heavy duty latch mechanism installed and test locked", cFurn, housing.getId(), student2.getId(), "Hostel Tower 1", "304", RequestStatus.CLOSED, technicians.get(4).getId(), null, now.minus(96, ChronoUnit.HOURS), 5, "Secure again, thank you!", now.minus(70, ChronoUnit.HOURS));

        log.info("Successfully seeded UniPulse dataset with 4 departments, 12 categories, 8 technicians, and 20 service requests.");
    }

    private Category createCat(String name, UUID deptId, RequestPriority priority, int slaHours) {
        return Category.builder()
                .id(UUID.randomUUID())
                .name(name)
                .departmentId(deptId)
                .defaultPriority(priority)
                .defaultSlaHours(slaHours)
                .isActive(true)
                .build();
    }

    private User createTech(String name, String email, String passwordHash, UUID deptId,
                            List<String> skills, String shift, int maxWorkload, int currentWorkload) {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash(passwordHash)
                .fullName(name)
                .role(UserRole.TECHNICIAN)
                .campusId((short) 1)
                .active(true)
                .build();
        userRepository.save(user);

        TechnicianProfile profile = TechnicianProfile.builder()
                .userId(user.getId())
                .departmentId(deptId)
                .skills(skills)
                .shift(shift)
                .maxWorkload(maxWorkload)
                .currentWorkload(currentWorkload)
                .isActive(true)
                .build();
        technicianProfileRepository.save(profile);
        return user;
    }

    private void createRequest(String title, String description, Category cat, UUID deptId, UUID requesterId,
                               String building, String room, RequestStatus status, UUID assigneeId,
                               Instant pausedAt, Instant resolvedAt, Integer rating, String ratingComment, Instant closedAt) {
        String publicId = publicIdGenerator.generatePublicId();
        Instant now = Instant.now();
        Instant dueAt = now.plus(cat.getDefaultSlaHours(), ChronoUnit.HOURS);

        ServiceRequest sr = ServiceRequest.builder()
                .id(UUID.randomUUID())
                .publicId(publicId)
                .title(title)
                .description(description)
                .status(status)
                .priority(cat.getDefaultPriority())
                .requesterId(requesterId)
                .departmentId(deptId)
                .categoryId(cat.getId())
                .assigneeId(assigneeId)
                .locationBlock(building)
                .locationRoom(room)
                .respondBy(now.plus(4, ChronoUnit.HOURS))
                .resolveBy(dueAt)
                .slaPausedAt(pausedAt)
                .resolvedAt(resolvedAt)
                .rating(rating)
                .ratingComment(ratingComment)
                .createdAt(now.minus(4, ChronoUnit.DAYS))
                .updatedAt(now)
                .build();
        requestRepository.save(sr);

        // Record initial RequestCreated outbox event
        OutboxEvent event = OutboxEvent.builder()
                .id(UUID.randomUUID())
                .aggregateType("ServiceRequest")
                .aggregateId(sr.getId().toString())
                .type("RequestCreated")
                .payload(String.format("{\"requestId\":\"%s\",\"publicId\":\"%s\",\"status\":\"%s\"}",
                        sr.getId(), sr.getPublicId(), sr.getStatus()))
                .status("PENDING")
                .createdAt(Instant.now())
                .build();
        outboxEventRepository.save(event);
    }
}
