import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useCreateNote } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetNotesQueryKey } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";

export default function NewNoteScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const createMutation = useCreateNote();

  const handleSummarize = async () => {
    if (!title.trim() || !text.trim()) { Alert.alert("Error", "Please enter a title and text"); return; }
    if (text.trim().length < 50) { Alert.alert("Error", "Text is too short. Please paste more content."); return; }
    try {
      const note = await createMutation.mutateAsync({ data: { title: title.trim(), originalText: text.trim() } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(note.summary);
      queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to summarize. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled" bottomOffset={20}>
        {!result ? (
          <>
            <View style={[nn.infoCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[nn.infoText, { color: colors.primary }]}>
                Paste any lecture notes, articles, or textbook content to get an AI summary
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={[nn.label, { color: colors.mutedForeground }]}>NOTE TITLE</Text>
              <TextInput
                style={[nn.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Photosynthesis — Chapter 3"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[nn.label, { color: colors.mutedForeground }]}>CONTENT TO SUMMARIZE</Text>
                <Text style={[nn.charCount, { color: text.length > 100 ? colors.success : colors.mutedForeground }]}>
                  {text.length} chars
                </Text>
              </View>
              <TextInput
                style={[nn.textArea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                value={text}
                onChangeText={setText}
                placeholder="Paste your long text here..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleSummarize}
              disabled={createMutation.isPending}
              activeOpacity={0.85}
              style={{ borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[nn.btn, createMutation.isPending && { opacity: 0.7 }]}
              >
                {createMutation.isPending ? (
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={nn.btnText}>AI is reading...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <Ionicons name="sparkles-outline" size={18} color="#FFF" />
                    <Text style={nn.btnText}>Summarize with AI</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ gap: 20 }}>
            <View style={[nn.successBanner, { backgroundColor: colors.success + "18", borderColor: colors.success + "40" }]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={[nn.successText, { color: colors.success }]}>Summary generated successfully</Text>
            </View>

            <Text style={[nn.resultTitle, { color: colors.foreground }]}>{title}</Text>

            <LinearGradient
              colors={[colors.primary + "18", colors.accent + "0C"]}
              style={[nn.summaryCard, { borderColor: colors.primary + "30" }]}
            >
              <View style={nn.summaryHeader}>
                <View style={[nn.sparkBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="sparkles" size={12} color="#FFF" />
                  <Text style={nn.sparkText}>AI SUMMARY</Text>
                </View>
              </View>
              <Text style={[nn.summaryText, { color: colors.foreground }]}>{result}</Text>
            </LinearGradient>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[nn.outlineBtn, { borderColor: colors.border, flex: 1 }]}
                onPress={() => { setResult(null); setTitle(""); setText(""); }}
              >
                <Text style={[nn.outlineBtnText, { color: colors.foreground }]}>New Note</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, borderRadius: 14, overflow: "hidden" }} onPress={() => router.back()} activeOpacity={0.85}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={nn.btn}>
                  <Text style={nn.btnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const nn = StyleSheet.create({
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.7 },
  charCount: { fontSize: 11, fontFamily: "Inter_500Medium" },
  input: { height: 50, borderRadius: 13, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular", borderWidth: 1 },
  textArea: { minHeight: 200, borderRadius: 13, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, borderWidth: 1 },
  btn: { height: 52, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  btnText: { color: "#FFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14, borderWidth: 1 },
  successText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  summaryCard: { borderRadius: 18, padding: 18, gap: 14, borderWidth: 1 },
  summaryHeader: { flexDirection: "row" },
  sparkBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  sparkText: { color: "#FFF", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  summaryText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  outlineBtn: { height: 52, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  outlineBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
