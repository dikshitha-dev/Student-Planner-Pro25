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
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useGetHabits, useGetStreak, useGetWeeklyStats, useUpsertHabit } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { getGetHabitsQueryKey, getGetStreakQueryKey, getGetWeeklyStatsQueryKey } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function WeeklyChart({ data, maxVal, color, label }: { data: number[]; maxVal: number; color: string; label: string }) {
  const colors = useColors();
  const w = 300;
  const h = 80;
  const barW = 28;
  const gap = (w - barW * 7) / 8;
  const chartMax = Math.max(maxVal, 1);

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 0.6, marginBottom: 8 }}>
        {label.toUpperCase()}
      </Text>
      <Svg width={w} height={h + 18}>
        <Defs>
          <SvgLinearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.3} />
          </SvgLinearGradient>
        </Defs>
        {data.map((val, i) => {
          const barH = (val / chartMax) * h;
          const x = gap + i * (barW + gap);
          const y = h - barH;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={barH} rx={8} fill={barH > 0 ? `url(#grad-${label})` : color} opacity={barH > 0 ? 1 : 0.12} />
              <SvgText x={x + barW / 2} y={h + 14} fontSize={10} fill={colors.mutedForeground} textAnchor="middle" fontFamily="Inter_400Regular">
                {DAYS[i]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function StepCounter({ label, value, min, max, step, unit, color, onChangeValue }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; color: string;
  onChangeValue: (v: number) => void;
}) {
  const colors = useColors();
  const pct = Math.round(((value - min) / (max - min)) * 100);

  return (
    <View style={[cnt.wrap, { backgroundColor: colors.card, borderColor: color + "30" }]}>
      <LinearGradient colors={[color + "18", color + "06"]} style={StyleSheet.absoluteFill} />
      <Text style={[cnt.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[cnt.value, { color }]}>{value.toFixed(step < 1 ? 1 : 0)}</Text>
      <Text style={[cnt.unit, { color: colors.mutedForeground }]}>{unit}</Text>
      <View style={[cnt.trackBg, { backgroundColor: color + "22" }]}>
        <View style={[cnt.trackFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={cnt.btns}>
        <TouchableOpacity
          style={[cnt.btn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
          onPress={() => { if (value > min) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChangeValue(Math.max(min, value - step)); } }}
          activeOpacity={0.7}
        >
          <Text style={[cnt.btnTxt, { color: colors.foreground }]}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cnt.btn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
          onPress={() => { if (value < max) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChangeValue(Math.min(max, value + step)); } }}
          activeOpacity={0.7}
        >
          <Text style={[cnt.btnTxt, { color: colors.foreground }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cnt = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: "center", gap: 6, overflow: "hidden" },
  label: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6 },
  value: { fontSize: 26, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 10, fontFamily: "Inter_400Regular" },
  trackBg: { width: "100%", height: 5, borderRadius: 3, overflow: "hidden" },
  trackFill: { height: 5, borderRadius: 3 },
  btns: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontSize: 18, lineHeight: 20 },
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
    if (todayHabit) { setStudy(todayHabit.studyHours); setWater(todayHabit.waterIntake); setSleep(todayHabit.sleepHours); }
  }, [todayHabit?.id]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({ data: { date: today, studyHours: study, waterIntake: water, sleepHours: sleep } });
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

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Habits" subtitle="Track your daily goals" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Habits" subtitle="Track your daily goals" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>

        {/* Streak Banner */}
        <LinearGradient
          colors={["#F59E0B22", "#F97316" + "11"]}
          style={[h.streakCard, { borderColor: "#F59E0B33", borderWidth: 1 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={h.streakMain}>
            <MaterialCommunityIcons name="fire" size={32} color="#F59E0B" />
            <View>
              <Text style={[h.streakNum, { color: "#F59E0B" }]}>{streak?.currentStreak ?? 0}</Text>
              <Text style={[h.streakSub, { color: colors.mutedForeground }]}>Day Streak</Text>
            </View>
          </View>
          <View style={[h.streakDiv, { backgroundColor: colors.border }]} />
          <View style={{ alignItems: "center" }}>
            <Text style={[h.streakNum, { color: colors.foreground }]}>{streak?.longestStreak ?? 0}</Text>
            <Text style={[h.streakSub, { color: colors.mutedForeground }]}>Best Ever</Text>
          </View>
          <View style={[h.streakDiv, { backgroundColor: colors.border }]} />
          <View style={{ alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginBottom: 2 }} />
            <Text style={[h.streakSub, { color: colors.mutedForeground }]}>Active</Text>
          </View>
        </LinearGradient>

        {/* Log Today */}
        <View style={{ gap: 12 }}>
          <Text style={[h.sectionTitle, { color: colors.foreground }]}>Log Today</Text>
          <View style={h.countersRow}>
            <StepCounter label="STUDY" value={study} min={0} max={12} step={0.5} unit="hrs" color={colors.study} onChangeValue={setStudy} />
            <StepCounter label="WATER" value={water} min={0} max={20} step={1} unit="glasses" color={colors.water} onChangeValue={setWater} />
            <StepCounter label="SLEEP" value={sleep} min={0} max={12} step={0.5} unit="hrs" color={colors.sleep} onChangeValue={setSleep} />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={upsertMutation.isPending}
            activeOpacity={0.85}
            style={{ borderRadius: 14, overflow: "hidden" }}
          >
            <LinearGradient
              colors={saved ? [colors.success, "#059669"] : [colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[h.saveBtn, upsertMutation.isPending && { opacity: 0.7 }]}
            >
              {upsertMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Ionicons name={saved ? "checkmark-circle" : "save-outline"} size={18} color="#FFF" />
                  <Text style={h.saveBtnText}>{saved ? "Saved!" : "Save Today's Log"}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Weekly Charts */}
        <View style={{ gap: 12 }}>
          <Text style={[h.sectionTitle, { color: colors.foreground }]}>This Week</Text>
          <View style={[h.chartsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <WeeklyChart data={(weekly ?? []).map(w => w.studyHours)} maxVal={8} color={colors.study} label="Study Hours" />
            <View style={[h.divider, { backgroundColor: colors.border }]} />
            <WeeklyChart data={(weekly ?? []).map(w => w.waterIntake)} maxVal={12} color={colors.water} label="Water (glasses)" />
            <View style={[h.divider, { backgroundColor: colors.border }]} />
            <WeeklyChart data={(weekly ?? []).map(w => w.sleepHours)} maxVal={10} color={colors.sleep} label="Sleep Hours" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const h = StyleSheet.create({
  streakCard: { borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  streakMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
  streakSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  streakDiv: { width: 1, height: 40 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  countersRow: { flexDirection: "row", gap: 10 },
  saveBtn: { height: 52, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  saveBtnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  chartsCard: { borderRadius: 20, padding: 20, gap: 20, borderWidth: 1 },
  divider: { height: 1 },
});
