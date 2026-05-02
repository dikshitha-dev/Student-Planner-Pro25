import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useGenerateStudyPlan } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

type Session = { subjectId: string; subjectName: string; hours: number };
type Day = { date: string; sessions: Session[] };

export default function PlanScreen() {
  const colors = useColors();
  const generateMutation = useGenerateStudyPlan();
  const [plan, setPlan] = useState<Day[] | null>(null);

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({});
      setPlan(result as Day[]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to generate study plan. Make sure you have subjects added.");
    }
  };

  const SUBJECT_COLORS = [colors.primary, colors.violet, colors.water, colors.success, colors.sleep, colors.destructive, "#EC4899", colors.study];
  const subjectColorMap = new Map<string, string>();
  let ci = 0;
  (plan ?? []).forEach((day) => {
    day.sessions.forEach((s) => {
      if (!subjectColorMap.has(s.subjectId)) { subjectColorMap.set(s.subjectId, SUBJECT_COLORS[ci % SUBJECT_COLORS.length]!); ci++; }
    });
  });

  const totalHours = (plan ?? []).reduce((sum, d) => sum + d.sessions.reduce((s2, s) => s2 + s.hours, 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        {!plan ? (
          <View style={pl.generateView}>
            <LinearGradient
              colors={[colors.violet + "22", colors.accent + "0E"]}
              style={[pl.iconBox, { borderColor: colors.violet + "30" }]}
            >
              <Ionicons name="sparkles" size={44} color={colors.violet} />
            </LinearGradient>
            <Text style={[pl.genTitle, { color: colors.foreground }]}>AI Study Planner</Text>
            <Text style={[pl.genDesc, { color: colors.mutedForeground }]}>
              Based on your exam dates, subject priorities, and hours needed, we'll create an optimized day-by-day schedule.
            </Text>

            <View style={[pl.featureList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: "calendar-outline", text: "Distributed across available days" },
                { icon: "trophy-outline", text: "Prioritizes harder subjects" },
                { icon: "time-outline", text: "Focuses on near-deadline exams" },
              ].map((f, i) => (
                <View key={i} style={[pl.featureRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={[pl.featureIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Ionicons name={f.icon as any} size={14} color={colors.primary} />
                  </View>
                  <Text style={[pl.featureText, { color: colors.foreground }]}>{f.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleGenerate}
              disabled={generateMutation.isPending}
              activeOpacity={0.85}
              style={{ borderRadius: 16, overflow: "hidden", width: "100%" }}
            >
              <LinearGradient
                colors={[colors.violet, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[pl.genBtn, generateMutation.isPending && { opacity: 0.7 }]}
              >
                {generateMutation.isPending ? (
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={pl.genBtnText}>Generating your plan...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Ionicons name="sparkles-outline" size={18} color="#FFF" />
                    <Text style={pl.genBtnText}>Generate My Plan</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : plan.length === 0 ? (
          <View style={pl.generateView}>
            <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
            <Text style={[pl.genTitle, { color: colors.foreground }]}>No Plan Available</Text>
            <Text style={[pl.genDesc, { color: colors.mutedForeground }]}>Add subjects with future exam dates to generate a plan.</Text>
          </View>
        ) : (
          <>
            {/* Summary header */}
            <LinearGradient
              colors={[colors.violet, colors.accent]}
              style={pl.summaryBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={pl.summaryBig}>{plan.length}-Day Plan</Text>
                <Text style={pl.summarySub}>{totalHours.toFixed(0)} total study hours</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPlan(null)}
                style={[pl.regenBtn]}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={14} color="#FFF" />
                <Text style={pl.regenText}>Regenerate</Text>
              </TouchableOpacity>
            </LinearGradient>

            {plan.map((day) => {
              const total = day.sessions.reduce((s, x) => s + x.hours, 0);
              const date = new Date(day.date);
              return (
                <View key={day.date} style={[pl.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={pl.dayHeader}>
                    <View>
                      <Text style={[pl.dayWeekday, { color: colors.foreground }]}>
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </Text>
                      <Text style={[pl.dayDate, { color: colors.mutedForeground }]}>
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    </View>
                    <View style={[pl.totalBadge, { backgroundColor: colors.primary + "18" }]}>
                      <Text style={[pl.totalText, { color: colors.primary }]}>{total.toFixed(1)}h</Text>
                    </View>
                  </View>

                  <View style={{ gap: 10 }}>
                    {day.sessions.map((session, idx) => {
                      const sColor = subjectColorMap.get(session.subjectId) ?? colors.primary;
                      const pct = Math.min(100, (session.hours / 5) * 100);
                      return (
                        <View key={idx} style={{ gap: 6 }}>
                          <View style={pl.sessionRow}>
                            <View style={[pl.sessionDot, { backgroundColor: sColor }]} />
                            <Text style={[pl.sessionName, { color: colors.foreground }]} numberOfLines={1}>{session.subjectName}</Text>
                            <Text style={[pl.sessionH, { color: sColor }]}>{session.hours.toFixed(1)}h</Text>
                          </View>
                          <View style={[pl.barTrack, { backgroundColor: colors.secondary }]}>
                            <LinearGradient
                              colors={[sColor, sColor + "AA"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[pl.barFill, { width: `${pct}%` as any }]}
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

const pl = StyleSheet.create({
  generateView: { alignItems: "center", paddingTop: 40, gap: 18 },
  iconBox: { width: 90, height: 90, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  genTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  genDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
  featureList: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  featureIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  genBtn: { height: 54, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  genBtnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  summaryBanner: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center" },
  summaryBig: { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold" },
  summarySub: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  regenBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  regenText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dayCard: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 14 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayWeekday: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dayDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  totalBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  totalText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  sessionName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  sessionH: { fontSize: 13, fontFamily: "Inter_700Bold" },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
});
