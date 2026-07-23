export type CmsPageType = 'ABOUT' | 'TERMS' | 'PRIVACY' | 'FAQ' | 'CUSTOM';

export interface CmsPage {
  id: number;
  restaurant_id: number;
  slug: string;
  title: string;
  content: string;
  page_type: CmsPageType;
  is_published: boolean;
  sort_order: number;
}

export interface CmsPageCreate {
  slug: string;
  title: string;
  content: string;
  page_type: CmsPageType;
  is_published: boolean;
  sort_order: number;
}

export interface CmsPageUpdate {
  slug?: string;
  title?: string;
  content?: string;
  page_type?: CmsPageType;
  is_published?: boolean;
  sort_order?: number;
}
