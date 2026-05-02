import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGenerateStudyPlan } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function PlanScreen() {
  const colors = useColors();
  const generateMutation = useGenerateStudyPlan();
  const [plan, setPlan] = useState<Array<{
    date: string;
    sessions: Array<{ subjectId: string; subjectName: string; hours: number }>;
  }> | null>(null);

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({});
      setPlan(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to generate study plan");
    }
  };

  const SUBJECT_COLORS = [
    "#6366F1", "#8B5CF6", "#06B6D4", "#10B981",
    "#F59E0B", "#EF4444", "#EC4899", "#3B82F6",
  ];

  const subjectColorMap = new Map<string, string>();
  let colorIdx = 0;
  (plan ?? []).forEach((day) => {
    day.sessions.forEach((session) => {
      if (!subjectColorMap.has(session.subjectId)) {
        subjectColorMap.set(session.subjectId, SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]!);
        colorIdx++;
      }
    });
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        {!plan ? (
          <View style={s.generateView}>
            <View style={[s.iconContainer, { backgroundColor: (colors as Record<string, string>).violet + "22" }]}>
              <Ionicons name="sparkles" size={40} color={(colors as Record<string, string>).violet} />
            </View>
            <Text style={[s.generateTitle, { color: colors.foreground }]}>
              Generate Your Study Plan
            </Text>
            <Text style={[s.generateDesc, { color: colors.mutedForeground }]}>
              Based on your subjects, exam dates, and priorities, we'll create an optimized day-by-day study schedule.
            </Text>
            <TouchableOpacity
              style={[s.generateBtn, { backgroundColor: (colors as Record<string, string>).violet }]}
              onPress={handleGenerate}
              disabled={generateMutation.isPending}
              activeOpacity={0.8}
            >
              {generateMutation.isPending ? (
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={s.generateBtnText}>Generating...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Ionicons name="sparkles-outline" size={18} color="#FFF" />
                  <Text style={s.generateBtnText}>Generate Plan</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : plan.length === 0 ? (
          <View style={s.generateView}>
            <Text style={[s.generateTitle, { color: colors.foreground }]}>No Plan Available</Text>
            <Text style={[s.generateDesc, { color: colors.mutedForeground }]}>
              Add some subjects with future exam dates to generate a plan.
            </Text>
          </View>
        ) : (
          <>
            <View style={s.planHeader}>
              <Text style={[s.planTitle, { color: colors.foreground }]}>
                {plan.length}-Day Study Plan
              </Text>
              <TouchableOpacity onPress={() => setPlan(null)} style={[s.regenerateBtn, { backgroundColor: colors.secondary }]}>
                <Ionicons name="refresh" size={14} color={colors.primary} />
                <Text style={[s.regenerateBtnText, { color: colors.primary }]}>Regenerate</Text>
              </TouchableOpacity>
            </View>

            {plan.map((day) => {
              const totalHours = day.sessions.reduce((sum, s) => sum + s.hours, 0);
              const dateObj = new Date(day.date);
              return (
                <View key={day.date} style={[s.dayCard, { backgroundColor: colors.card }]}>
                  <View style={s.dayHeader}>
                    <View>
                      <Text style={[s.dayDate, { color: colors.foreground }]}>
                        {dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </Text>
                    </View>
                    <View style={[s.totalBadge, { backgroundColor: colors.primary + "22" }]}>
                      <Text style={[s.totalText, { color: colors.primary }]}>
                        {totalHours.toFixed(1)}h total
                      </Text>
                    </View>
                  </View>

                  <View style={s.sessions}>
                    {day.sessions.map((session, idx) => {
                      const subColor = subjectColorMap.get(session.subjectId) ?? colors.primary;
                      const widthPct = Math.min(100, (session.hours / 6) * 100);
                      return (
                        <View key={idx} style={s.sessionRow}>
                          <View style={{ width: 90 }}>
                            <Text style={[s.sessionSubject, { color: colors.foreground }]} numberOfLines={1}>
                              {session.subjectName}
                            </Text>
                            <Text style={[s.sessionHours, { color: colors.mutedForeground }]}>
                              {session.hours.toFixed(1)}h
                            </Text>
                          </View>
                          <View style={[s.barTrack, { backgroundColor: colors.border }]}>
                            <View
                              style={[
                                s.barFill,
                                { width: `${widthPct}%` as any, backgroundColor: subColor },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  generateView: { alignItems: "center", paddingTop: 60, gap: 16 },
  iconContainer: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  generateTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  generateDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 24, lineHeight: 22 },
  generateBtn: {
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  generateBtnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  regenerateBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  regenerateBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dayCard: { borderRadius: 16, padding: 16, gap: 14 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayDate: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  totalBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  totalText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sessions: { gap: 10 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sessionSubject: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sessionHours: { fontSize: 11, fontFamily: "Inter_400Regular" },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
});
