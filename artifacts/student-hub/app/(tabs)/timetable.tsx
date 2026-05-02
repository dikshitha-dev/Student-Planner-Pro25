import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useGetTimetable, useCreateTimetableEntry, useDeleteTimetableEntry } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTimetableQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#3B82F6"];

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const COL_WIDTH = 46;
const LABEL_WIDTH = 42;

export default function TimetableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 84;

  const { data: entries, isLoading } = useGetTimetable();
  const createMutation = useCreateTimetableEntry();
  const deleteMutation = useDeleteTimetableEntry();

  const [showModal, setShowModal] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]!);

  const handleCreate = async () => {
    if (!subjectName.trim()) { Alert.alert("Error", "Please enter a subject name"); return; }
    try {
      await createMutation.mutateAsync({ data: { subjectName: subjectName.trim(), dayOfWeek: selectedDay, startTime, endTime, color: selectedColor } });
      queryClient.invalidateQueries({ queryKey: getGetTimetableQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
      setSubjectName("");
    } catch { Alert.alert("Error", "Failed to add entry"); }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Class", `Remove "${name}" from your schedule?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getGetTimetableQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }},
    ]);
  };

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Schedule"
        subtitle="Weekly timetable"
        rightElement={
          <TouchableOpacity
            style={[tt.addBtn, { overflow: "hidden", borderRadius: 12 }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tt.addBtnGrad}>
              <Feather name="plus" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad, padding: 12 }}>
            {/* Day headers */}
            <View style={{ flexDirection: "row", paddingLeft: LABEL_WIDTH, paddingBottom: 8 }}>
              {DAYS.map((d, i) => (
                <View key={i} style={{ width: COL_WIDTH, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: colors.mutedForeground, letterSpacing: 0.3 }}>{d}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row" }}>
              {/* Time labels */}
              <View style={{ width: LABEL_WIDTH }}>
                {HOURS.map((h) => (
                  <View key={h} style={{ height: HOUR_HEIGHT, paddingRight: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "right" }}>
                      {h > 12 ? `${h - 12}pm` : h === 12 ? "12pm" : `${h}am`}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Day columns */}
              {DAYS.map((_, dayIdx) => {
                const dayEntries = (entries ?? []).filter((e) => e.dayOfWeek === dayIdx);
                return (
                  <View key={dayIdx} style={{ width: COL_WIDTH, height: totalHeight, position: "relative" }}>
                    {HOURS.map((h) => (
                      <View key={h} style={{ position: "absolute", top: (h - START_HOUR) * HOUR_HEIGHT, left: 0, right: 0, height: 1, backgroundColor: colors.border }} />
                    ))}
                    {dayEntries.map((entry) => {
                      const top = (timeToMinutes(entry.startTime) - START_HOUR * 60) * (HOUR_HEIGHT / 60);
                      const height = (timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime)) * (HOUR_HEIGHT / 60);
                      return (
                        <TouchableOpacity
                          key={entry.id}
                          style={{ position: "absolute", top, left: 2, right: 2, height: Math.max(height, 24), borderRadius: 8, overflow: "hidden" }}
                          onLongPress={() => handleDelete(entry.id, entry.subjectName)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[entry.color, entry.color + "BB"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={{ flex: 1, padding: 4 }}
                          >
                            <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFF" }} numberOfLines={2}>{entry.subjectName}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={[tt.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20, borderTopColor: colors.border }]}>
            <View style={[tt.dragHandle, { backgroundColor: colors.border }]} />
            <Text style={[tt.modalTitle, { color: colors.foreground }]}>Add Class</Text>

            <Text style={[tt.mLabel, { color: colors.mutedForeground }]}>SUBJECT NAME</Text>
            <TextInput
              style={[tt.mInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="e.g. Calculus, Physics"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[tt.mLabel, { color: colors.mutedForeground }]}>DAY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {DAYS.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[tt.dayChip, { backgroundColor: selectedDay === i ? colors.primary : colors.secondary, borderColor: selectedDay === i ? colors.primary : colors.border }]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={{ color: selectedDay === i ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              {[{ label: "START TIME", val: startTime, set: setStartTime, ph: "09:00" }, { label: "END TIME", val: endTime, set: setEndTime, ph: "10:00" }].map((f) => (
                <View key={f.label} style={{ flex: 1 }}>
                  <Text style={[tt.mLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                  <TextInput
                    style={[tt.mInput, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
                    value={f.val}
                    onChangeText={f.set}
                    placeholder={f.ph}
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              ))}
            </View>

            <Text style={[tt.mLabel, { color: colors.mutedForeground }]}>COLOR</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[tt.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 2.5 : 0, borderColor: "#FFF", transform: selectedColor === c ? [{ scale: 1.15 }] : [] }]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={[tt.mBtn, { backgroundColor: colors.secondary, flex: 1 }]} onPress={() => setShowModal(false)}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, borderRadius: 14, overflow: "hidden" }} onPress={handleCreate} disabled={createMutation.isPending}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tt.mBtn}>
                  {createMutation.isPending ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Add Class</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const tt = StyleSheet.create({
  addBtn: { width: 38, height: 38 },
  addBtnGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderTopWidth: 1 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  mLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 6, letterSpacing: 0.6 },
  mInput: { height: 46, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, fontFamily: "Inter_400Regular", borderWidth: 1, marginBottom: 16 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  mBtn: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
