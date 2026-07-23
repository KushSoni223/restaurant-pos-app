import { apiRequest } from './client';
import type { CmsPage, CmsPageCreate, CmsPageUpdate } from '@/types/cms';

export async function listCmsPages(
  restaurantId: number,
  publishedOnly = false,
): Promise<CmsPage[]> {
  return apiRequest<CmsPage[]>(
    `/api/v1/cms/pages?restaurant_id=${restaurantId}&published_only=${publishedOnly}`,
  );
}

export async function getCmsPageBySlug(
  restaurantId: number,
  slug: string,
  publishedOnly = false,
): Promise<CmsPage> {
  return apiRequest<CmsPage>(
    `/api/v1/cms/pages/${encodeURIComponent(slug)}?restaurant_id=${restaurantId}&published_only=${publishedOnly}`,
  );
}

export async function createCmsPage(
  restaurantId: number,
  payload: CmsPageCreate,
): Promise<CmsPage> {
  return apiRequest<CmsPage>(
    `/api/v1/cms/pages?restaurant_id=${restaurantId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export async function updateCmsPage(pageId: number, payload: CmsPageUpdate): Promise<CmsPage> {
  return apiRequest<CmsPage>(
    `/api/v1/cms/pages/${pageId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    true,
  );
}

export async function deleteCmsPage(pageId: number): Promise<void> {
  await apiRequest<void>(
    `/api/v1/cms/pages/${pageId}`,
    {
      method: 'DELETE',
    },
    true,
  );
}
