package com.attvs.backend.service;

import com.attvs.backend.repository.AttackEventRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class DataRetentionService {

    private final AttackEventRepository repository;

    public DataRetentionService(AttackEventRepository repository) {
        this.repository = repository;
    }

    // Cơ chế Cron Job: Chạy ngầm vào lúc 00:00:00 mỗi ngày
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupOldData() {
        System.out.println("🧹 [RETENTION] Đang khởi động tiến trình dọn dẹp dữ liệu cũ...");

        // Tính toán mốc thời gian: Lấy thời điểm hiện tại lùi lại 3 ngày
        // (Nếu VPS bạn ít dung lượng, có thể đổi số 3 thành 1 ngày)
        Instant cutoff = Instant.now().minus(3, ChronoUnit.DAYS);

        // Ra lệnh xóa DB và in ra số lượng dòng đã bị xóa
        repository.deleteOldEvents(cutoff)
                .doOnSuccess(deletedCount -> {
                    System.out.println("✅ [RETENTION] Đã xóa thành công " + deletedCount + " bản ghi tấn công thô cũ hơn 3 ngày.");
                    System.out.println("💾 [RETENTION] Giải phóng ổ cứng thành công. Thống kê tổng vẫn được bảo toàn trong Redis.");
                })
                .doOnError(error -> System.err.println("❌ [RETENTION] Lỗi khi dọn dẹp Database: " + error.getMessage()))
                .subscribe(); // WebFlux bắt buộc phải subscribe() thì mới chạy
    }
}