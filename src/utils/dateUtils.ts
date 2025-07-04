// dateUtils.ts

/**
 * 将中国标准时间的日期转换为UTC字符串（支持边界时间修正）
 * @param cstDate 中国标准时间的Date对象或字符串（需可被Date解析）
 * @param isEndOfDay 是否设置为当天的最后一刻（用于结束时间）
 * @returns ISO格式的UTC时间字符串
 */
export function convertCSTToUTC(
    cstDate: Date | string,
    isEndOfDay: boolean = false
): string {
    const date = new Date(cstDate);

    // 验证输入是否为合法日期
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date input');
    }

    // 中国时区偏移量（单位：分钟，转换为毫秒）
    const cstOffsetMs = 8 * 60 * 60 * 1000; // UTC+8

    // 转换为实际UTC时间
    const utcTime = date.getTime() + cstOffsetMs;
    const adjustedDate = new Date(utcTime);

    if (isEndOfDay) {
        // 设置为当天的最后一刻（23:59:59.999）
        adjustedDate.setUTCHours(23, 59, 59, 999);
    } else {
        // 设置为当天的起始时间（00:00:00.000）
        adjustedDate.setUTCHours(0, 0, 0, 0);
    }

    return adjustedDate.toISOString();
}

/**
 * 生成日期范围查询参数（中国时区友好）
 * @param startCST 中国标准时间开始日期（包含该日）
 * @param endCST 中国标准时间结束日期（包含该日）
 * @returns 适用于Supabase范围查询的{ startUTC: string, endUTC: string }
 */
export function generateDateRange(
    startCST: Date | string,
    endCST: Date | string
): { startUTC: string; endUTC: string } {
    // 处理开始时间（包含当天起始）
    const startUTC = convertCSTToUTC(startCST);

    // 处理结束时间（延至次日零点，闭合区间）
    const endDate = new Date(endCST);
    const endUTC = convertCSTToUTC(endDate,true);

    return {
        startUTC,
        endUTC
    };
}

/**
 * 格式化日期字符串
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString?: string) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
}

// 类型导出（如有需要）
export type DateRange = ReturnType<typeof generateDateRange>;
