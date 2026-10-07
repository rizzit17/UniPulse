package com.unipulse.analytics.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DailyRequestStatsId implements Serializable {

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;
}
