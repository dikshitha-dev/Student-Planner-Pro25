import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetNotes, useDeleteNote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetNotesQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function NotesListScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useGetNotes();
  const deleteMutation = useDeleteNote();

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Note", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id });
          queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={notes ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>No notes yet</Text>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              Paste any long text to get an AI summary
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.noteCard, { backgroundColor: colors.card }]}>
            <View style={s.noteHeader}>
              <Text style={[s.noteTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
            <View style={[s.summaryBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[s.summaryBadgeText, { color: colors.primary }]}>AI Summary</Text>
            </View>
            <Text style={[s.summaryText, { color: colors.mutedForeground }]} numberOfLines={3}>
              {item.summary}
            </Text>
            <Text style={[s.noteDate, { color: colors.mutedForeground }]}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/notes/new")}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
  noteCard: { borderRadius: 16, padding: 16, gap: 10 },
  noteHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, marginRight: 10 },
  summaryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  summaryBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  summaryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
