import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetCompanies: string[];
  createdAt: string;
  updatedAt: string;
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;

      return (data || []).map(flag => ({
        id: flag.id,
        key: flag.key,
        description: flag.description,
        enabled: flag.enabled ?? false,
        rolloutPercentage: flag.rollout_percentage ?? 100,
        targetCompanies: flag.target_companies || [],
        createdAt: flag.created_at ?? '',
        updatedAt: flag.updated_at ?? '',
      })) as FeatureFlag[];
    },
  });
};

export const useCreateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { error } = await supabase
        .from('feature_flags')
        .insert({
          key: flag.key,
          description: flag.description,
          enabled: flag.enabled,
          rollout_percentage: flag.rolloutPercentage,
          target_companies: flag.targetCompanies,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag creato');
    },
    onError: (error) => {
      toast.error('Errore nella creazione del feature flag', {
        description: error.message,
      });
    },
  });
};

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...flag }: Partial<FeatureFlag> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (flag.key !== undefined) updateData.key = flag.key;
      if (flag.description !== undefined) updateData.description = flag.description;
      if (flag.enabled !== undefined) updateData.enabled = flag.enabled;
      if (flag.rolloutPercentage !== undefined) updateData.rollout_percentage = flag.rolloutPercentage;
      if (flag.targetCompanies !== undefined) updateData.target_companies = flag.targetCompanies;

      const { error } = await supabase
        .from('feature_flags')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag aggiornato');
    },
    onError: (error) => {
      toast.error('Errore nell\'aggiornamento del feature flag', {
        description: error.message,
      });
    },
  });
};

export const useDeleteFeatureFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag eliminato');
    },
    onError: (error) => {
      toast.error('Errore nell\'eliminazione del feature flag', {
        description: error.message,
      });
    },
  });
};
