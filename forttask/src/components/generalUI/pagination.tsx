'use client';
import { useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
    totalNumberOfItems: number;
    itemsPerPage: number;
}

export default function Pagination({ totalNumberOfItems, itemsPerPage }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const url = (page: number) => {
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set('page', page.toString());
        return `${pathname}?${params.toString()}`;
    };
    const totalPages = Math.ceil(totalNumberOfItems / itemsPerPage);
    const [currentPage, setCurrentPage] = useState(() => {
        const pageParam = parseInt(searchParams?.get('page') || '1', 10);
        return pageParam > 0 && pageParam <= totalPages ? pageParam : 1;
    });
    return (
        <div className="flex flex-col items-center justify-center p-6 text-zinc-50 w-full">
            <div className="flex items-center justify-center w-full gap-4">
                {(() => {
                    const pages = [];
                    const addEllipsis = (key: string) =>
                        pages.push(
                            <span key={key} className="p-2 flex">
                                ...
                            </span>,
                        );

                    for (let page = 1; page <= totalPages; page++) {
                        if (
                            page === 1 ||
                            page === 2 ||
                            page === totalPages ||
                            page === totalPages - 1 ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                            pages.push(
                                <Link
                                    key={page}
                                    href={url(page)}
                                    className={clsx(
                                        'px-5 py-2 rounded-xl max-w-4 max-h-32 text-base text-zinc-50 flex items-center justify-center',
                                        currentPage === page ? 'bg-zinc-800' : 'bg-zinc-700 hover:bg-zinc-600',
                                    )}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </Link>,
                            );
                        } else if (
                            (page === 3 && currentPage > 4) ||
                            (page === totalPages - 2 && currentPage < totalPages - 3)
                        ) {
                            addEllipsis(`ellipsis-${page}`);
                        }
                    }

                    return pages;
                })()}
            </div>
            <div className="mt-4 text-sm text-zinc-500">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
}
