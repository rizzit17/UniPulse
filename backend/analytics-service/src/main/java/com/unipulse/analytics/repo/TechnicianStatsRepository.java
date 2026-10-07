package com.unipulse.analytics.repo;

import com.unipulse.analytics.model.TechnicianStats;
import com.unipulse.analytics.model.TechnicianStatsId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TechnicianStatsRepository extends JpaRepository<TechnicianStats, TechnicianStatsId> {

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.technician_stats (date, technician_id, assigned_count, resolved_count, total_resolve_seconds, avg_resolve_seconds)
        VALUES (:date, :technicianId, 1, 0, 0, 0)
        ON CONFLICT (date, technician_id)
        DO UPDATE SET assigned_count = analytics.technician_stats.assigned_count + 1
    """)
    void incrementAssigned(@Param("date") LocalDate date,
                           @Param("technicianId") UUID technicianId);

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.technician_stats (date, technician_id, assigned_count, resolved_count, total_resolve_seconds, avg_resolve_seconds)
        VALUES (:date, :technicianId, 0, 1, :resolveSeconds, :resolveSeconds)
        ON CONFLICT (date, technician_id)
        DO UPDATE SET 
            resolved_count = analytics.technician_stats.resolved_count + 1,
            total_resolve_seconds = analytics.technician_stats.total_resolve_seconds + :resolveSeconds,
            avg_resolve_seconds = CAST((analytics.technician_stats.total_resolve_seconds + :resolveSeconds) / (analytics.technician_stats.resolved_count + 1) AS INT)
    """)
    void incrementResolved(@Param("date") LocalDate date,
                           @Param("technicianId") UUID technicianId,
                           @Param("resolveSeconds") long resolveSeconds);

    @Query("SELECT t FROM TechnicianStats t WHERE t.id.date >= :startDate AND t.id.date <= :endDate")
    List<TechnicianStats> findBetweenDates(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM TechnicianStats t WHERE t.id.technicianId = :technicianId AND t.id.date >= :startDate AND t.id.date <= :endDate")
    List<TechnicianStats> findByTechnicianBetweenDates(@Param("technicianId") UUID technicianId,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
}
