import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetNotes, useGetPlannerSubjects } from "@workspace/api-client-react";

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const { data: notes } = useGetNotes();
  const { data: subjects } = useGetPlannerSubjects();

  const tools = [
    {
      id: "notes",
      title: "Notes Summarizer",
      description: "Paste long text and get an AI-powered concise summary instantly",
      icon: "document-text-outline",
      color: colors.primary,
      badge: notes?.length ?? 0,
      badgeLabel: "notes",
      onPress: () => router.push("/notes/index"),
    },
    {
      id: "planner",
      title: "Study Planner",
      description: "Add subjects and exam dates to generate an optimized study schedule",
      icon: "calendar-outline",
      color: (colors as Record<string, string>).violet,
      badge: subjects?.length ?? 0,
      badgeLabel: "subjects",
      onPress: () => router.push("/planner/index"),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 20,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.foreground }]}>Tools</Text>
      <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
        AI-powered study tools
      </Text>

      <View style={s.toolsList}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[s.toolCard, { backgroundColor: colors.card, borderColor: tool.color + "33" }]}
            onPress={tool.onPress}
            activeOpacity={0.8}
          >
            <View style={[s.toolIconContainer, { backgroundColor: tool.color + "22" }]}>
              <Ionicons name={tool.icon as any} size={28} color={tool.color} />
            </View>
            <View style={s.toolContent}>
              <View style={s.toolHeader}>
                <Text style={[s.toolTitle, { color: colors.foreground }]}>{tool.title}</Text>
                {tool.badge > 0 && (
                  <View style={[s.badge, { backgroundColor: tool.color + "22" }]}>
                    <Text style={[s.badgeText, { color: tool.color }]}>
                      {tool.badge} {tool.badgeLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[s.toolDescription, { color: colors.mutedForeground }]}>
                {tool.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 28 },
  toolsList: { gap: 16 },
  toolCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
  },
  toolIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toolContent: { flex: 1, gap: 6 },
  toolHeader: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  toolTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  toolDescription: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
