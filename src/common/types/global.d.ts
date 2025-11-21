export {};

declare global {
  interface Meta {
    limit: number; // items per page
    page: number; // current page number
    totalElements: number; // total number of elements
    totalPages: number; // total number of pages
  }

  interface BackendRes<T> {
    data: T;
    meta?: Meta;
  }
}
