package com.unipulse.analytics.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class HotspotId implements Serializable {

    @Column(name = "location_block", nullable = false, length = 64)
    private String locationBlock;

    @Column(name = "location_room", nullable = false, length = 64)
    private String locationRoom;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;
}
