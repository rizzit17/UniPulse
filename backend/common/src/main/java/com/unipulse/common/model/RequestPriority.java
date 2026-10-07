package com.unipulse.common.model;

import lombok.Getter;

@Getter
public enum RequestPriority {
    P1(5, 15, 240),      // 15 min respond, 4 hr resolve, weight 5
    P2(3, 60, 720),      // 1 hr respond, 12 hr resolve, weight 3
    P3(2, 240, 2880),    // 4 hr respond, 48 hr resolve, weight 2
    P4(1, 1440, 10080);  // 24 hr respond, 7 d resolve, weight 1

    private final int weight;
    private final int defaultRespondMinutes;
    private final int defaultResolveMinutes;

    RequestPriority(int weight, int defaultRespondMinutes, int defaultResolveMinutes) {
        this.weight = weight;
        this.defaultRespondMinutes = defaultRespondMinutes;
        this.defaultResolveMinutes = defaultResolveMinutes;
    }
}
