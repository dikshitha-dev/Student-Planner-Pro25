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
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "../../context/AuthContext";
import {
  useGetStreak,
  useGetHabits,
  useGetPlannerSubjects,
} from "@workspace/api-client-react";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const today = new Date().toISOString().split("T")[0]!;
  const { data: streak } = useGetStreak();
  const { data: habits, isLoading: habitsLoading } = useGetHabits({
    params: { startDate: today, endDate: today },
  });
  const { data: subjects } = useGetPlannerSubjects();

  const todayHabit = habits?.[0];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const upcomingExams = (subjects ?? [])
    .filter((s) => new Date(s.examDate) >= new Date())
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 3);

  const s = styles(colors);

  const MetricCard = ({
    icon,
    label,
    value,
    unit,
    color,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | undefined;
    unit: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={[s.metricCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={s.metricIcon}>{icon}</View>
      <Text style={s.metricValue}>
        {habitsLoading ? "—" : (value ?? 0).toFixed(1)}
      </Text>
      <Text style={s.metricUnit}>{unit}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[s.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {getGreeting()},</Text>
          <Text style={s.userName}>{user?.name?.split(" ")[0] ?? "Student"}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Streak Banner */}
      {(streak?.currentStreak ?? 0) > 0 && (
        <View style={s.streakBanner}>
          <MaterialCommunityIcons name="fire" size={22} color="#F59E0B" />
          <Text style={s.streakText}>
            {streak!.currentStreak} day streak — keep it up!
          </Text>
        </View>
      )}

      {/* Today's Stats */}
      <Text style={s.sectionTitle}>Today</Text>
      <View style={s.metricsRow}>
        <MetricCard
          icon={<Ionicons name="book-outline" size={20} color={(colors as Record<string, string>).study} />}
          label="Study"
          value={todayHabit?.studyHours}
          unit="hrs"
          color={(colors as Record<string, string>).study}
          onPress={() => router.push("/(tabs)/habits")}
        />
        <MetricCard
          icon={<Ionicons name="water-outline" size={20} color={(colors as Record<string, string>).water} />}
          label="Water"
          value={todayHabit?.waterIntake}
          unit="glasses"
          color={(colors as Record<string, string>).water}
          onPress={() => router.push("/(tabs)/habits")}
        />
        <MetricCard
          icon={<Ionicons name="moon-outline" size={20} color={(colors as Record<string, string>).sleep} />}
          label="Sleep"
          value={todayHabit?.sleepHours}
          unit="hrs"
          color={(colors as Record<string, string>).sleep}
          onPress={() => router.push("/(tabs)/habits")}
        />
      </View>

      {/* Upcoming Exams */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Upcoming Exams</Text>
        <TouchableOpacity onPress={() => router.push("/planner/index")}>
          <Text style={s.sectionLink}>View all</Text>
        </TouchableOpacity>
      </View>

      {upcomingExams.length === 0 ? (
        <View style={s.emptyCard}>
          <Feather name="calendar" size={24} color={colors.mutedForeground} />
          <Text style={s.emptyText}>No exams scheduled</Text>
          <TouchableOpacity onPress={() => router.push("/planner/add")}>
            <Text style={s.emptyLink}>Add subjects</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.examsList}>
          {upcomingExams.map((s2) => {
            const daysLeft = Math.ceil(
              (new Date(s2.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const urgentColor =
              daysLeft <= 3 ? "#EF4444" : daysLeft <= 7 ? "#F59E0B" : colors.success;
            return (
              <View key={s2.id} style={[s.examCard, { borderLeftColor: urgentColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.examName}>{s2.name}</Text>
                  <Text style={s.examDate}>{formatDate(s2.examDate)}</Text>
                </View>
                <View style={[s.daysBadge, { backgroundColor: urgentColor + "22" }]}>
                  <Text style={[s.daysText, { color: urgentColor }]}>
                    {daysLeft}d
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actionsGrid}>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push("/notes/new")} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
          <Text style={s.actionLabel}>Summarize Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push("/planner/index")} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={24} color={(colors as Record<string, string>).violet} />
          <Text style={s.actionLabel}>Study Planner</Text>
        </TouchableOpacity>
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingTop: 20,
      paddingBottom: 24,
    },
    greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    userName: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.foreground },
    logoutBtn: { padding: 8, marginTop: 4 },
    streakBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#F59E0B11",
      borderRadius: 12,
      padding: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: "#F59E0B33",
    },
    streakText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#F59E0B" },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 12 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary },
    metricsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
    metricCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderTopWidth: 2,
      gap: 4,
    },
    metricIcon: { marginBottom: 4 },
    metricValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    metricUnit: { fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    metricLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 8,
      marginBottom: 28,
    },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    emptyLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.primary },
    examsList: { gap: 10, marginBottom: 28 },
    examCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderLeftWidth: 3,
    },
    examName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    examDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
    daysBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    daysText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    actionsGrid: { flexDirection: "row", gap: 12, marginBottom: 28 },
    actionCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      gap: 12,
    },
    actionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, textAlign: "center" },
  });
