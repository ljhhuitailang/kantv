import { NextRequest, NextResponse } from 'next/server';

import { resolveAdultFilter } from '@/lib/adult-filter';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { getAvailableApiSites, getConfig } from '@/lib/config';

export const runtime = 'edge';

// OrionTV 兼容接口 - 获取可用的视频源列表
export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const config = await getAvailableApiSites(authInfo.username);
    const globalConfig = await getConfig();

    // 🔒 成人内容过滤逻辑 - 使用三级优先级
    const userConfig = globalConfig.UserConfig.Users.find(
      (u) => u.username === authInfo.username,
    );
    const userDisableAdultFilter = userConfig?.disableAdultFilter;

    const shouldFilterAdult = resolveAdultFilter(
      searchParams,
      globalConfig.SiteConfig.DisableYellowFilter,
      userDisableAdultFilter,
    );

    const apiSites = shouldFilterAdult
      ? config.filter((site) => !site.is_adult)
      : config;

    return NextResponse.json(apiSites, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'X-Adult-Filter': shouldFilterAdult ? 'enabled' : 'disabled', // 调试信息
      },
    });
  } catch {
    return NextResponse.json({ error: '获取资源失败' }, { status: 500 });
  }
}

// CORS 预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie',
      'Access-Control-Max-Age': '86400',
    },
  });
}
