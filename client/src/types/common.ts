/** Backend envelope: every response is `{ statusCode, message, data }`. */
export type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};

export type ApiError = {
  statusCode: number;
  message: string;
};

export type PaginationMeta = {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

/** Every modal registered in the aggregator receives these two props. */
export type ModalBaseProps = {
  isOpen: boolean;
  onClose: () => void;
};
