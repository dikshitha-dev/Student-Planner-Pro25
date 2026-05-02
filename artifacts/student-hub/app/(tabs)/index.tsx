import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { useGetStreak, useGetHabits, useGetPlannerSubjects } from "@workspace/api-client-react";

export default function HomeScreen() {
  const colors = useColors();
  const { toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const today = new Date().toISOString().split("T")[0]!;
  const { data: streak } = useGetStreak();
  const { data: habits, isLoading: habitsLoading } = useGetHabits({ params: { startDate: today, endDate: today } });
  const { data: subjects } = useGetPlannerSubjects();

  const todayHabit = habits?.[0];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const upcomingExams = (subjects ?? [])
    .filter((s) => new Date(s.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 3);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero gradient header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.hero, { paddingTop: topPad + 16 }]}
      >
        <View style={s.heroRow}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[s.themeBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? "sunny" : "moon"} size={17} color={isDark ? "#FCD34D" : "#FFF"} />
          </TouchableOpacity>

          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={s.heroGreeting}>Good {getGreeting()},</Text>
            <Text style={s.heroName}>{user?.name?.split(" ")[0] ?? "Student"}</Text>
          </View>

          <TouchableOpacity onPress={logout} style={[s.logoutBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            <Ionicons name="log-out-outline" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {(streak?.currentStreak ?? 0) > 0 && (
          <View style={s.streakChip}>
            <MaterialCommunityIcons name="fire" size={16} color="#FCD34D" />
            <Text style={s.streakChipText}>{streak!.currentStreak} day streak</Text>
          </View>
        )}
      </LinearGradient>

      <View style={s.body}>
        {/* Stats */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Today</Text>
            <Text style={[s.sectionDate, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </View>

          {habitsLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={s.statsRow}>
              <StatCard
                icon={<Ionicons name="book-outline" size={20} color={colors.study} />}
                label="Study"
                value={todayHabit?.studyHours?.toFixed(1) ?? "0.0"}
                unit="hrs"
                accentColor={colors.study}
                onPress={() => router.push("/(tabs)/habits")}
              />
              <StatCard
                icon={<Ionicons name="water-outline" size={20} color={colors.water} />}
                label="Water"
                value={todayHabit?.waterIntake ?? 0}
                unit="glasses"
                accentColor={colors.water}
                onPress={() => router.push("/(tabs)/habits")}
              />
              <StatCard
                icon={<Ionicons name="moon-outline" size={20} color={colors.sleep} />}
                label="Sleep"
                value={todayHabit?.sleepHours?.toFixed(1) ?? "0.0"}
                unit="hrs"
                accentColor={colors.sleep}
                onPress={() => router.push("/(tabs)/habits")}
              />
            </View>
          )}
        </View>

        {/* Upcoming Exams */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Upcoming Exams</Text>
            <TouchableOpacity onPress={() => router.push("/planner/index")}>
              <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {upcomingExams.length === 0 ? (
            <TouchableOpacity
              style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, borderStyle: "dashed" }]}
              onPress={() => router.push("/planner/add")}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Add your first exam</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.examsList}>
              {upcomingExams.map((subj) => {
                const daysLeft = Math.ceil((new Date(subj.examDate).getTime() - Date.now()) / 86400000);
                const urgentColor = daysLeft <= 3 ? "#EF4444" : daysLeft <= 7 ? "#F59E0B" : colors.success;
                return (
                  <View key={subj.id} style={[s.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.examDot, { backgroundColor: urgentColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.examName, { color: colors.foreground }]}>{subj.name}</Text>
                      <Text style={[s.examDate, { color: colors.mutedForeground }]}>
                        {new Date(subj.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                    </View>
                    <View style={[s.daysBadge, { backgroundColor: urgentColor + "20" }]}>
                      <Text style={[s.daysText, { color: urgentColor }]}>{daysLeft}d</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/notes/new")}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[colors.primary + "22", colors.primary + "08"]} style={StyleSheet.absoluteFill} />
              <View style={[s.actionIcon, { backgroundColor: colors.primary + "22" }]}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Summarize</Text>
              <Text style={[s.actionSub, { color: colors.mutedForeground }]}>AI Notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/planner/index")}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[colors.violet + "22", colors.violet + "08"]} style={StyleSheet.absoluteFill} />
              <View style={[s.actionIcon, { backgroundColor: colors.violet + "22" }]}>
                <Ionicons name="calendar-outline" size={22} color={colors.violet} />
              </View>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Study Plan</Text>
              <Text style={[s.actionSub, { color: colors.mutedForeground }]}>AI Planner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/habits")}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[colors.success + "22", colors.success + "08"]} style={StyleSheet.absoluteFill} />
              <View style={[s.actionIcon, { backgroundColor: colors.success + "22" }]}>
                <MaterialCommunityIcons name="fire" size={22} color={colors.success} />
              </View>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Log Habits</Text>
              <Text style={[s.actionSub, { color: colors.mutedForeground }]}>Daily Track</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/timetable")}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[colors.water + "22", colors.water + "08"]} style={StyleSheet.absoluteFill} />
              <View style={[s.actionIcon, { backgroundColor: colors.water + "22" }]}>
                <Ionicons name="grid-outline" size={22} color={colors.water} />
              </View>
              <Text style={[s.actionTitle, { color: colors.foreground }]}>Schedule</Text>
              <Text style={[s.actionSub, { color: colors.mutedForeground }]}>Timetable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  heroRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  themeBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroGreeting: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  heroName: { fontSize: 26, color: "#FFF", fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  logoutBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  streakChipText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  body: { padding: 20, gap: 28 },
  section: { gap: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loadingRow: { height: 120, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 12 },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  examsList: { gap: 10 },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  examDot: { width: 8, height: 8, borderRadius: 4 },
  examName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  examDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  daysBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  daysText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "47%",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 10,
    overflow: "hidden",
  },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
