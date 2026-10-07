package com.unipulse.core.shared.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unipulse.common.error.ApiError;
import com.unipulse.common.error.ApiException;
import com.unipulse.core.auth.service.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private final ApiRateLimiter apiRateLimiter;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserPrincipal principal) {
            try {
                apiRateLimiter.checkLimit(principal.getId());
            } catch (ApiException ex) {
                log.warn("Rate limit triggered on endpoint {} for user {}", request.getRequestURI(), principal.getId());
                handleRateLimitError(request, response, ex);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void handleRateLimitError(
            HttpServletRequest request,
            HttpServletResponse response,
            ApiException ex
    ) throws IOException {
        response.setStatus(ex.getStatus());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

        ApiError apiError = ApiError.of(
                ex.getStatus(),
                "Rate Limit Exceeded",
                ex.getMessage(),
                ex.getCode(),
                java.net.URI.create(request.getRequestURI())
        );

        response.getWriter().write(objectMapper.writeValueAsString(apiError));
    }
}
