import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useGetPlannerSubjects, useDeletePlannerSubject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlannerSubjectsQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

const PRIORITY_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#F97316", "#EF4444"];

export default function PlannerScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading } = useGetPlannerSubjects();
  const deleteMutation = useDeletePlannerSubject();

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Subject", `Remove "${name}" from your planner?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getGetPlannerSubjectsQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }},
    ]);
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>;
  }

  const sorted = [...(subjects ?? [])].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 160 }}
        ListEmptyComponent={
          <View style={[p.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[p.emptyIcon, { backgroundColor: colors.violet + "18" }]}>
              <Ionicons name="book-outline" size={36} color={colors.violet} />
            </View>
            <Text style={[p.emptyTitle, { color: colors.foreground }]}>No subjects yet</Text>
            <Text style={[p.emptyDesc, { color: colors.mutedForeground }]}>
              Add your exam subjects to generate a personalized study plan
            </Text>
            <TouchableOpacity onPress={() => router.push("/planner/add")} style={{ borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
              <LinearGradient colors={[colors.violet, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={p.emptyBtn}>
                <Text style={p.emptyBtnText}>Add First Subject</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const daysLeft = Math.ceil((new Date(item.examDate).getTime() - Date.now()) / 86400000);
          const pColor = PRIORITY_COLORS[Math.min(item.priority - 1, 4)] ?? PRIORITY_COLORS[0]!;
          const urgentColor = daysLeft <= 3 ? "#EF4444" : daysLeft <= 7 ? "#F59E0B" : colors.success;
          return (
            <View style={[p.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[p.priorityBar, { backgroundColor: pColor }]} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[p.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
                  <View style={[p.priorityChip, { backgroundColor: pColor + "22" }]}>
                    <Text style={[p.priorityText, { color: pColor }]}>P{item.priority}</Text>
                  </View>
                </View>
                <View style={p.metaRow}>
                  <View style={p.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[p.metaText, { color: colors.mutedForeground }]}>
                      {new Date(item.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Text>
                  </View>
                  <View style={p.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[p.metaText, { color: colors.mutedForeground }]}>{item.hoursNeeded}h needed</Text>
                  </View>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 10 }}>
                <View style={[p.daysBadge, { backgroundColor: urgentColor + "1A" }]}>
                  <Text style={[p.daysText, { color: urgentColor }]}>{daysLeft}d left</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={p.bottomBar}>
        {sorted.length > 0 && (
          <TouchableOpacity style={{ flex: 1, borderRadius: 16, overflow: "hidden" }} onPress={() => router.push("/planner/plan")} activeOpacity={0.85}>
            <LinearGradient colors={[colors.violet, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={p.genBtn}>
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={p.genBtnText}>Generate AI Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={{ borderRadius: 16, overflow: "hidden" }} onPress={() => router.push("/planner/add")} activeOpacity={0.85}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={p.addBtn}>
            <Feather name="plus" size={22} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  empty: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 12, marginTop: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 16, borderWidth: 1, overflow: "hidden" },
  priorityBar: { width: 4, height: 44, borderRadius: 2 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  priorityChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  daysBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  daysText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  bottomBar: { position: "absolute", bottom: 24, left: 16, right: 16, flexDirection: "row", gap: 12 },
  genBtn: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16 },
  genBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  addBtn: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 16 },
});
