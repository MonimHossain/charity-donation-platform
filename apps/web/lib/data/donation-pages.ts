"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { USE_MOCK_DATA } from "@/lib/config";
import {
  useDonationPages as useStorePages,
  useDonationPage as useStorePage,
  createDonationPage as storeCreate,
  upsertDonationPage,
  deleteDonationPage as storeDelete,
  type DonationPage,
} from "@/lib/stores/donationPageStore";
import {
  fetchAdminDonationPages,
  fetchAdminDonationPageById,
  createAdminDonationPage,
  updateAdminDonationPage,
  deleteAdminDonationPage,
} from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useDonationPagesAdmin() {
  const storePages = useStorePages();

  const query = useQuery({
    queryKey: queryKeys.donationPages,
    queryFn: async () => {
      const res = await fetchAdminDonationPages();
      return res.items ?? res.data ?? [];
    },
    enabled: !USE_MOCK_DATA,
  });

  if (USE_MOCK_DATA) {
    return { data: storePages, isLoading: false, refetch: () => {} };
  }

  return { data: query.data ?? [], isLoading: query.isLoading, refetch: query.refetch };
}

export function useDonationPageAdmin(id: string) {
  const storePage = useStorePage(id);

  const query = useQuery({
    queryKey: [...queryKeys.donationPages, id],
    queryFn: () => fetchAdminDonationPageById(id),
    enabled: !USE_MOCK_DATA && Boolean(id),
  });

  if (USE_MOCK_DATA) {
    return { data: storePage, isLoading: false };
  }

  return { data: query.data, isLoading: query.isLoading };
}

export function useDonationPageMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      if (USE_MOCK_DATA) return storeCreate();
      return createAdminDonationPage({});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.donationPages }),
  });

  const update = useMutation({
    mutationFn: async ({ id, payload, page }: { id: string; payload: Record<string, unknown>; page?: DonationPage }) => {
      if (USE_MOCK_DATA) {
        if (page) upsertDonationPage({ ...page, ...payload } as DonationPage);
        return;
      }
      return updateAdminDonationPage(id, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.donationPages }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCK_DATA) return storeDelete(id);
      return deleteAdminDonationPage(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.donationPages }),
  });

  return { create, update, remove };
}
