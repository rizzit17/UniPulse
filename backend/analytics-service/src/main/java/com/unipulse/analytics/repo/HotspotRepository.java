package com.unipulse.analytics.repo;

import com.unipulse.analytics.model.Hotspot;
import com.unipulse.analytics.model.HotspotId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface HotspotRepository extends JpaRepository<Hotspot, HotspotId> {

    @Modifying
    @Query(nativeQuery = true, value = """
        INSERT INTO analytics.hotspots (location_block, location_room, category_id, count_30d, last_reported_at)
        VALUES (:block, :room, :categoryId, 1, :now)
        ON CONFLICT (location_block, location_room, category_id)
        DO UPDATE SET 
            count_30d = analytics.hotspots.count_30d + 1,
            last_reported_at = :now
    """)
    void recordComplaint(@Param("block") String block,
                         @Param("room") String room,
                         @Param("categoryId") UUID categoryId,
                         @Param("now") Instant now);

    @Query("SELECT h FROM Hotspot h ORDER BY h.count30d DESC")
    List<Hotspot> findTopHotspots(Pageable pageable);
}
