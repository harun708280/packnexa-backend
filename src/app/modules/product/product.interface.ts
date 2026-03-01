export type IProductFilters = {
    searchTerm?: string;
    category?: string;
    status?: string;
    page?: string;
    limit?: string;
};

export type IGenericResponse<T> = {
    meta: {
        page: number;
        limit: number;
        total: number;
    };
    data: T;
};
