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
import { useGetPlannerSubjects, useDeletePlannerSubject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlannerSubjectsQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

const PRIORITY_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#F97316", "#EF4444",
];

export default function PlannerScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading } = useGetPlannerSubjects();
  const deleteMutation = useDeletePlannerSubject();

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id });
          queryClient.invalidateQueries({ queryKey: getGetPlannerSubjectsQueryKey() });
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
        data={subjects ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 160 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="book-outline" size={48} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>No subjects yet</Text>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              Add subjects and exam dates to generate a study plan
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const daysLeft = Math.ceil(
            (new Date(item.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const priorityColor = PRIORITY_COLORS[Math.min(item.priority - 1, 4)] ?? PRIORITY_COLORS[0]!;
          return (
            <View style={[s.subjectCard, { backgroundColor: colors.card, borderLeftColor: priorityColor }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Text style={[s.subjectName, { color: colors.foreground }]}>{item.name}</Text>
                  <View style={[s.priorityBadge, { backgroundColor: priorityColor + "22" }]}>
                    <Text style={[s.priorityText, { color: priorityColor }]}>P{item.priority}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <Text style={[s.meta, { color: colors.mutedForeground }]}>
                    Exam: {new Date(item.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                  <Text style={[s.meta, { color: colors.mutedForeground }]}>
                    {item.hoursNeeded}h needed
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <View style={[s.daysBadge, {
                  backgroundColor: daysLeft <= 3 ? "#EF444422" : daysLeft <= 7 ? "#F59E0B22" : "#10B98122",
                }]}>
                  <Text style={[s.daysText, {
                    color: daysLeft <= 3 ? "#EF4444" : daysLeft <= 7 ? "#F59E0B" : "#10B981",
                  }]}>
                    {daysLeft}d
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.generateBtn, { backgroundColor: (colors as Record<string, string>).violet }]}
          onPress={() => router.push("/planner/plan")}
          activeOpacity={0.8}
          disabled={(subjects ?? []).length === 0}
        >
          <Ionicons name="sparkles" size={18} color="#FFF" />
          <Text style={s.generateBtnText}>Generate Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/planner/add")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
  },
  subjectName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  priorityText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  daysBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  daysText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  bottomBar: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  generateBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
