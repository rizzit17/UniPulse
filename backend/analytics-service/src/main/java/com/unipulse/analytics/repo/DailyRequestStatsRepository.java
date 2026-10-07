package com.unipulse.analytics.repo;

import com.unipulse.analytics.model.DailyRequestStats;
import com.unipulse.analytics.model.DailyRequestStatsId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyRequestStatsRepository extends JpaRepository<DailyRequestStats, DailyRequestStatsId> {

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.daily_request_stats (date, department_id, category_id, created_count, resolved_count, breached_count, sla_warning_count)
        VALUES (:date, :departmentId, :categoryId, 1, 0, 0, 0)
        ON CONFLICT (date, department_id, category_id)
        DO UPDATE SET created_count = analytics.daily_request_stats.created_count + 1
    """)
    void incrementCreated(@Param("date") LocalDate date,
                          @Param("departmentId") UUID departmentId,
                          @Param("categoryId") UUID categoryId);

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.daily_request_stats (date, department_id, category_id, created_count, resolved_count, breached_count, sla_warning_count)
        VALUES (:date, :departmentId, :categoryId, 0, 1, 0, 0)
        ON CONFLICT (date, department_id, category_id)
        DO UPDATE SET resolved_count = analytics.daily_request_stats.resolved_count + 1
    """)
    void incrementResolved(@Param("date") LocalDate date,
                           @Param("departmentId") UUID departmentId,
                           @Param("categoryId") UUID categoryId);

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.daily_request_stats (date, department_id, category_id, created_count, resolved_count, breached_count, sla_warning_count)
        VALUES (:date, :departmentId, :categoryId, 0, 0, 1, 0)
        ON CONFLICT (date, department_id, category_id)
        DO UPDATE SET breached_count = analytics.daily_request_stats.breached_count + 1
    """)
    void incrementBreached(@Param("date") LocalDate date,
                           @Param("departmentId") UUID departmentId,
                           @Param("categoryId") UUID categoryId);

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.daily_request_stats (date, department_id, category_id, created_count, resolved_count, breached_count, sla_warning_count)
        VALUES (:date, :departmentId, :categoryId, 0, 0, 0, 1)
        ON CONFLICT (date, department_id, category_id)
        DO UPDATE SET sla_warning_count = analytics.daily_request_stats.sla_warning_count + 1
    """)
    void incrementWarning(@Param("date") LocalDate date,
                          @Param("departmentId") UUID departmentId,
                          @Param("categoryId") UUID categoryId);

    @Query("SELECT d FROM DailyRequestStats d WHERE d.id.date >= :startDate AND d.id.date <= :endDate")
    List<DailyRequestStats> findBetweenDates(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    @Query("SELECT d FROM DailyRequestStats d WHERE d.id.departmentId = :departmentId AND d.id.date >= :startDate AND d.id.date <= :endDate")
    List<DailyRequestStats> findByDepartmentBetweenDates(@Param("departmentId") UUID departmentId,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);
}
