package com.unipulse.core.request.api;

import com.unipulse.common.model.RequestPriority;
import com.unipulse.common.model.RequestStatus;
import com.unipulse.core.auth.service.UserPrincipal;
import com.unipulse.core.request.service.RequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@Tag(name = "Service Requests", description = "Core service request lifecycle and management APIs")
public class RequestController {

    private final RequestService requestService;
    private final com.unipulse.core.shared.idempotency.IdempotencyService idempotencyService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit new service request (FR-REQ-1)")
    public ResponseEntity<RequestDtos.RequestResponse> createRequest(
            @Valid @RequestBody RequestDtos.CreateRequestRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            java.util.Optional<RequestDtos.RequestResponse> existing =
                    idempotencyService.getStoredResponse(idempotencyKey, RequestDtos.RequestResponse.class);
            if (existing.isPresent()) {
                RequestDtos.RequestResponse cachedResponse = existing.get();
                return ResponseEntity.status(HttpStatus.CREATED)
                        .header(HttpHeaders.ETAG, "\"" + cachedResponse.version() + "\"")
                        .body(cachedResponse);
            }
        }

        RequestDtos.RequestResponse response = requestService.createRequest(request, principal.getId());

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.storeResponse(idempotencyKey, response, java.time.Duration.ofHours(24));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List service requests with keyset cursor pagination (FR-REQ-6)")
    public ResponseEntity<RequestDtos.CursorPageResponse<RequestDtos.RequestResponse>> listRequests(
            @RequestParam(value = "requesterId", required = false) UUID requesterId,
            @RequestParam(value = "departmentId", required = false) UUID departmentId,
            @RequestParam(value = "categoryId", required = false) UUID categoryId,
            @RequestParam(value = "assigneeId", required = false) UUID assigneeId,
            @RequestParam(value = "status", required = false) RequestStatus status,
            @RequestParam(value = "priority", required = false) RequestPriority priority,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit,
            @AuthenticationPrincipal UserPrincipal principal) {

        RequestDtos.CursorPageResponse<RequestDtos.RequestResponse> page = requestService.listRequests(
                requesterId,
                departmentId,
                categoryId,
                assigneeId,
                status,
                priority,
                cursor,
                limit,
                principal.getId(),
                principal.getRole(),
                null
        );

        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get request details by ID")
    public ResponseEntity<RequestDtos.RequestResponse> getRequestById(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        RequestDtos.RequestResponse response = requestService.getRequestById(
                id,
                principal.getId(),
                principal.getRole(),
                null
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    @GetMapping("/public/{publicId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get request details by public ID (e.g. UP-2026-100001)")
    public ResponseEntity<RequestDtos.RequestResponse> getRequestByPublicId(
            @PathVariable("publicId") String publicId,
            @AuthenticationPrincipal UserPrincipal principal) {

        RequestDtos.RequestResponse response = requestService.getRequestByPublicId(
                publicId,
                principal.getId(),
                principal.getRole(),
                null
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update request details with optimistic concurrency check (FR-REQ-2)")
    public ResponseEntity<RequestDtos.RequestResponse> updateRequest(
            @PathVariable("id") UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody RequestDtos.UpdateRequestRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long version = parseIfMatch(ifMatch);
        RequestDtos.RequestResponse response = requestService.updateRequest(
                id,
                request,
                version,
                principal.getId(),
                principal.getRole()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Transition request status with state machine and SLA clock rules (FR-REQ-3)")
    public ResponseEntity<RequestDtos.RequestResponse> transitionStatus(
            @PathVariable("id") UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody RequestDtos.TransitionStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long version = parseIfMatch(ifMatch);
        RequestDtos.RequestResponse response = requestService.transitionStatus(
                id,
                request,
                version,
                principal.getId(),
                principal.getRole()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPT_HEAD')")
    @Operation(summary = "Assign technician to request")
    public ResponseEntity<RequestDtos.RequestResponse> assignRequest(
            @PathVariable("id") UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody RequestDtos.AssignRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long version = parseIfMatch(ifMatch);
        RequestDtos.RequestResponse response = requestService.assignRequest(
                id,
                request,
                version,
                principal.getId(),
                principal.getRole()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add comment to request (FR-REQ-4)")
    public ResponseEntity<RequestDtos.RequestCommentResponse> addComment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RequestDtos.AddCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        RequestDtos.RequestCommentResponse comment = requestService.addComment(
                id,
                request,
                principal.getId(),
                principal.getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List comments for request (internal comments hidden from requesters)")
    public ResponseEntity<List<RequestDtos.RequestCommentResponse>> getComments(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(requestService.getComments(id, principal.getRole()));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get audit history for request (FR-REQ-7)")
    public ResponseEntity<List<RequestDtos.RequestHistoryResponse>> getHistory(
            @PathVariable("id") UUID id) {

        return ResponseEntity.ok(requestService.getHistory(id));
    }

    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('REQUESTER')")
    @Operation(summary = "Submit requester satisfaction rating (FR-REQ-5)")
    public ResponseEntity<RequestDtos.RequestResponse> rateRequest(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RequestDtos.RateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        RequestDtos.RequestResponse response = requestService.rateRequest(id, request, principal.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.version() + "\"")
                .body(response);
    }

    private Long parseIfMatch(String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) {
            return null;
        }
        String cleaned = ifMatch.replace("\"", "").trim();
        try {
            return Long.parseLong(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
