/**
 * 解析成人内容过滤设置
 *
 * @param searchParams URL 查询参数
 * @param disableYellowFilter 全局成人内容过滤设置（来自 SiteConfig）
 * @param userDisableAdultFilter 用户级别的成人内容过滤设置（来自 UserConfig，可选）
 * @returns true 表示应该过滤成人内容，false 表示不过滤
 *
 * 优先级规则：
 * 1. URL 参数（adult, filter）- 最高优先级
 * 2. 用户级别设置（userDisableAdultFilter）- 中优先级
 * 3. 全局设置（disableYellowFilter）- 最低优先级
 *
 * 使用场景：
 * - 站长可以通过管理后台为特定用户开启/关闭成人内容过滤
 * - 用户仍可通过 URL 参数临时覆盖设置
 */
export function resolveAdultFilter(
  searchParams: URLSearchParams,
  disableYellowFilter: boolean,
  userDisableAdultFilter?: boolean
): boolean {
  // 1. 首先检查 URL 参数（最高优先级）
  const adultParam = searchParams.get('adult');
  const filterParam = searchParams.get('filter');

  if (adultParam === '1' || adultParam === 'true') {
    return false; // 不过滤
  } else if (adultParam === '0' || adultParam === 'false') {
    return true; // 过滤
  } else if (filterParam === 'off' || filterParam === 'disable') {
    return false; // 不过滤
  } else if (filterParam === 'on' || filterParam === 'enable') {
    return true; // 过滤
  }

  // 2. 如果 URL 参数未指定，使用用户级别设置
  if (userDisableAdultFilter !== undefined) {
    return !userDisableAdultFilter; // userDisableAdultFilter=true 表示对该用户禁用过滤
  }

  // 3. 最后使用全局设置
  return !disableYellowFilter; // disableYellowFilter=true 表示全局禁用过滤
}

/**
 * 兼容旧版本的函数签名
 * @deprecated 请使用新版本的 resolveAdultFilter，支持用户级别控制
 */
export function resolveAdultFilterLegacy(
  searchParams: URLSearchParams,
  disableYellowFilter: boolean
): boolean {
  return resolveAdultFilter(searchParams, disableYellowFilter, undefined);
}
