import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessCards } from '../services/supabase';
import { BusinessCard, CreateCardData, UpdateCardData } from '../types';

export const useBusinessCards = (userId: string) => {
  const queryClient = useQueryClient();

  const {
    data: cards,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['businessCards', userId],
    queryFn: () => businessCards.getAll(userId),
    enabled: !!userId,
  });

  const createCardMutation = useMutation({
    mutationFn: (cardData: CreateCardData) => 
      businessCards.create({ ...cardData, user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCards'] });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, ...updates }: UpdateCardData) => 
      businessCards.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCards'] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: businessCards.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCards'] });
    },
  });

  return {
    cards: cards?.data || [],
    isLoading,
    error,
    refetch,
    createCard: createCardMutation.mutateAsync,
    updateCard: updateCardMutation.mutateAsync,
    deleteCard: deleteCardMutation.mutateAsync,
    isCreating: createCardMutation.isPending,
    isUpdating: updateCardMutation.isPending,
    isDeleting: deleteCardMutation.isPending,
  };
};
