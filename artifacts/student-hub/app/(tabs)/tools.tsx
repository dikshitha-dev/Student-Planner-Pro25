import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useGetNotes, useGetPlannerSubjects } from "@workspace/api-client-react";

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;
  const { data: notes } = useGetNotes();
  const { data: subjects } = useGetPlannerSubjects();

  const tools = [
    {
      id: "notes",
      title: "Notes Summarizer",
      description: "Paste any text and get a concise AI-powered summary in seconds",
      icon: "document-text-outline" as const,
      color: colors.primary,
      grad: [colors.primary, colors.accent] as [string, string],
      badge: notes?.length ?? 0,
      badgeLabel: "notes saved",
      onPress: () => router.push("/notes/index"),
      action: "Summarize text",
    },
    {
      id: "planner",
      title: "Study Planner",
      description: "Add subjects with exam dates and generate an optimized daily study schedule",
      icon: "calendar-outline" as const,
      color: colors.violet,
      grad: [colors.violet, colors.accent] as [string, string],
      badge: subjects?.length ?? 0,
      badgeLabel: "subjects",
      onPress: () => router.push("/planner/index"),
      action: "Plan my studies",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="AI Tools" subtitle="Powered by OpenAI" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>
        {tools.map((tool) => (
          <TouchableOpacity key={tool.id} onPress={tool.onPress} activeOpacity={0.85} style={{ borderRadius: 22, overflow: "hidden" }}>
            <LinearGradient
              colors={tool.grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={t.toolGradCard}
            >
              <View style={t.toolRow}>
                <View style={t.toolIconWrap}>
                  <Ionicons name={tool.icon} size={30} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={t.toolTitle}>{tool.title}</Text>
                  <Text style={t.toolDesc}>{tool.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </View>

              <View style={t.toolFooter}>
                {tool.badge > 0 && (
                  <View style={t.badgeChip}>
                    <Text style={t.badgeText}>{tool.badge} {tool.badgeLabel}</Text>
                  </View>
                )}
                <View style={t.actionChip}>
                  <Text style={t.actionText}>{tool.action}</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Tips Card */}
        <View style={[t.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[t.tipsHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="bulb-outline" size={16} color={colors.sleep} />
            <Text style={[t.tipsTitle, { color: colors.foreground }]}>Pro Tips</Text>
          </View>
          {[
            { icon: "document-text-outline", color: colors.primary, text: "Paste 200+ words for the best AI summaries" },
            { icon: "calendar-outline", color: colors.violet, text: "Set priority 5 for subjects you struggle with most" },
            { icon: "time-outline", color: colors.sleep, text: "Generate your study plan at least 7 days before exams" },
          ].map((tip, i) => (
            <View key={i} style={t.tipRow}>
              <View style={[t.tipDot, { backgroundColor: tip.color + "22" }]}>
                <Ionicons name={tip.icon as any} size={13} color={tip.color} />
              </View>
              <Text style={[t.tipText, { color: colors.mutedForeground }]}>{tip.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const t = StyleSheet.create({
  toolGradCard: { borderRadius: 22, padding: 20, gap: 16 },
  toolRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  toolIconWrap: { width: 58, height: 58, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  toolTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 4 },
  toolDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 18 },
  toolFooter: { flexDirection: "row", gap: 10, alignItems: "center" },
  badgeChip: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: "#FFF", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actionChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  actionText: { color: "#FFF", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tipsCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  tipsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  tipDot: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
