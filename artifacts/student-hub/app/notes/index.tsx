import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }},
    ]);
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={notes ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={[n.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[n.emptyIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="document-text-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[n.emptyTitle, { color: colors.foreground }]}>No notes yet</Text>
            <Text style={[n.emptyDesc, { color: colors.mutedForeground }]}>
              Paste any text and get an AI-powered summary
            </Text>
            <TouchableOpacity onPress={() => router.push("/notes/new")} style={{ borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={n.emptyBtn}>
                <Text style={n.emptyBtnText}>Create First Note</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[n.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={n.noteTop}>
              <View style={[n.aiDot, { backgroundColor: colors.primary }]} />
              <Text style={[n.noteTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Feather name="trash-2" size={15} color={colors.destructive} />
              </TouchableOpacity>
            </View>
            <View style={[n.summaryBox, { backgroundColor: colors.primary + "0E" }]}>
              <Text style={[n.summaryLabel, { color: colors.primary }]}>AI SUMMARY</Text>
              <Text style={[n.summaryText, { color: colors.foreground }]} numberOfLines={3}>{item.summary}</Text>
            </View>
            <Text style={[n.noteDate, { color: colors.mutedForeground }]}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity style={[n.fab, { overflow: "hidden", borderRadius: 18 }]} onPress={() => router.push("/notes/new")} activeOpacity={0.8}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={n.fabGrad}>
          <Feather name="plus" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const n = StyleSheet.create({
  empty: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 12, marginTop: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  noteCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  noteTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiDot: { width: 8, height: 8, borderRadius: 4 },
  noteTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  summaryBox: { borderRadius: 12, padding: 12, gap: 6 },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  summaryText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  fab: { position: "absolute", bottom: 24, right: 16, width: 56, height: 56 },
  fabGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
});
