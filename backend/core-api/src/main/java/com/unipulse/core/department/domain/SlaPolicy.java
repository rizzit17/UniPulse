package com.unipulse.core.department.domain;

import com.unipulse.common.model.RequestPriority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "sla_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SlaPolicy {

    @Id
    @Enumerated(EnumType.STRING)
    @EqualsAndHashCode.Include
    @ToString.Include
    private RequestPriority priority;

    @Column(name = "respond_minutes", nullable = false)
    private int respondMinutes;

    @Column(name = "resolve_minutes", nullable = false)
    private int resolveMinutes;
}
