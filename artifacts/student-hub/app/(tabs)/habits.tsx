import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import {
  useGetHabits,
  useGetStreak,
  useGetWeeklyStats,
  useUpsertHabit,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { getGetHabitsQueryKey, getGetStreakQueryKey, getGetWeeklyStatsQueryKey } from "@workspace/api-client-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeeklyBarChart({
  data,
  key: _key,
  maxVal,
  color,
  label,
}: {
  data: number[];
  key?: string;
  maxVal: number;
  color: string;
  label: string;
}) {
  const colors = useColors();
  const width = 280;
  const height = 90;
  const barWidth = 26;
  const gap = (width - barWidth * 7) / 8;
  const chartMax = Math.max(maxVal, 1);

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginBottom: 8, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Svg width={width} height={height + 20}>
        <Line x1={0} y1={height} x2={width} y2={height} stroke={colors.border} strokeWidth={1} />
        {data.map((val, i) => {
          const barH = (val / chartMax) * height;
          const x = gap + i * (barWidth + gap);
          const y = height - barH;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={6}
                fill={color}
                opacity={barH > 0 ? 0.9 : 0.15}
              />
              <SvgText
                x={x + barWidth / 2}
                y={height + 14}
                fontSize={10}
                fill={colors.mutedForeground}
                textAnchor="middle"
                fontFamily="Inter_400Regular"
              >
                {DAYS[i]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function StepCounter({
  label,
  value,
  min,
  max,
  step,
  unit,
  color,
  onChangeValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  onChangeValue: (val: number) => void;
}) {
  const colors = useColors();
  const inc = () => {
    if (value < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeValue(Math.min(max, value + step));
    }
  };
  const dec = () => {
    if (value > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeValue(Math.max(min, value - step));
    }
  };
  return (
    <View style={[stepStyles.container, { borderColor: color + "44" }]}>
      <Text style={[stepStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={stepStyles.controls}>
        <TouchableOpacity onPress={dec} style={[stepStyles.btn, { borderColor: colors.border }]} activeOpacity={0.7}>
          <Text style={[stepStyles.btnText, { color: colors.foreground }]}>−</Text>
        </TouchableOpacity>
        <View style={stepStyles.valueContainer}>
          <Text style={[stepStyles.value, { color }]}>{value.toFixed(step < 1 ? 1 : 0)}</Text>
          <Text style={[stepStyles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
        </View>
        <TouchableOpacity onPress={inc} style={[stepStyles.btn, { borderColor: colors.border }]} activeOpacity={0.7}>
          <Text style={[stepStyles.btnText, { color: colors.foreground }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 12,
  },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 18, fontFamily: "Inter_500Medium", lineHeight: 20 },
  valueContainer: { alignItems: "center", minWidth: 44 },
  value: { fontSize: 22, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 10, fontFamily: "Inter_400Regular" },
});

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0]!;

  const { data: habits, isLoading } = useGetHabits({ params: { startDate: today, endDate: today } });
  const { data: streak } = useGetStreak();
  const { data: weekly } = useGetWeeklyStats();
  const upsertMutation = useUpsertHabit();

  const todayHabit = habits?.[0];
  const [study, setStudy] = useState(0);
  const [water, setWater] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (todayHabit) {
      setStudy(todayHabit.studyHours);
      setWater(todayHabit.waterIntake);
      setSleep(todayHabit.sleepHours);
    }
  }, [todayHabit?.id]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        data: { date: today, studyHours: study, waterIntake: water, sleepHours: sleep },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: getGetHabitsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetWeeklyStatsQueryKey() });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const weeklyStudy = (weekly ?? []).map((w) => w.studyHours);
  const weeklyWater = (weekly ?? []).map((w) => w.waterIntake);
  const weeklySleep = (weekly ?? []).map((w) => w.sleepHours);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 20, paddingBottom: bottomPad, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[hStyles.pageTitle, { color: colors.foreground }]}>Habits</Text>

      {/* Streak */}
      <View style={[hStyles.streakCard, { backgroundColor: colors.card }]}>
        <View style={hStyles.streakRow}>
          <MaterialCommunityIcons name="fire" size={28} color="#F59E0B" />
          <View>
            <Text style={[hStyles.streakNum, { color: "#F59E0B" }]}>
              {streak?.currentStreak ?? 0} days
            </Text>
            <Text style={[hStyles.streakSub, { color: colors.mutedForeground }]}>Current streak</Text>
          </View>
        </View>
        <View style={hStyles.streakDivider} />
        <View>
          <Text style={[hStyles.streakNum, { color: colors.foreground }]}>
            {streak?.longestStreak ?? 0}
          </Text>
          <Text style={[hStyles.streakSub, { color: colors.mutedForeground }]}>Best streak</Text>
        </View>
      </View>

      {/* Today Log */}
      <Text style={[hStyles.sectionTitle, { color: colors.foreground }]}>Log Today</Text>
      <View style={hStyles.countersRow}>
        <StepCounter
          label="STUDY"
          value={study}
          min={0}
          max={12}
          step={0.5}
          unit="hrs"
          color={(colors as Record<string, string>).study}
          onChangeValue={setStudy}
        />
        <StepCounter
          label="WATER"
          value={water}
          min={0}
          max={20}
          step={1}
          unit="glasses"
          color={(colors as Record<string, string>).water}
          onChangeValue={setWater}
        />
        <StepCounter
          label="SLEEP"
          value={sleep}
          min={0}
          max={12}
          step={0.5}
          unit="hrs"
          color={(colors as Record<string, string>).sleep}
          onChangeValue={setSleep}
        />
      </View>

      <TouchableOpacity
        style={[hStyles.saveBtn, { backgroundColor: saved ? (colors as Record<string, string>).success : colors.primary }]}
        onPress={handleSave}
        disabled={upsertMutation.isPending}
        activeOpacity={0.8}
      >
        {upsertMutation.isPending ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={hStyles.saveBtnText}>{saved ? "Saved!" : "Save Today's Log"}</Text>
        )}
      </TouchableOpacity>

      {/* Weekly Charts */}
      <Text style={[hStyles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
      <View style={[hStyles.chartsCard, { backgroundColor: colors.card }]}>
        <WeeklyBarChart
          data={weeklyStudy}
          maxVal={8}
          color={(colors as Record<string, string>).study}
          label="Study Hours"
        />
        <WeeklyBarChart
          data={weeklyWater}
          maxVal={12}
          color={(colors as Record<string, string>).water}
          label="Water (glasses)"
        />
        <WeeklyBarChart
          data={weeklySleep}
          maxVal={10}
          color={(colors as Record<string, string>).sleep}
          label="Sleep Hours"
        />
      </View>
    </ScrollView>
  );
}

const hStyles = StyleSheet.create({
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 20 },
  streakCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  streakNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  streakSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  streakDivider: { width: 1, height: 40, backgroundColor: "#1F2937" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16 },
  countersRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  saveBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  chartsCard: { borderRadius: 16, padding: 20, marginBottom: 28 },
});
