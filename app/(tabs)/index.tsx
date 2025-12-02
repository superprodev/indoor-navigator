import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Input } from '@/components/ui/input'
import { View } from '@/components/ui/view'
import { StyleSheet, TextInputChangeEvent } from "react-native"
import { useSelector, shallowEqual, useDispatch } from "react-redux"
import { ProfileState, profileSlice } from "@/store/profileSlice"
import { AppDispatch, RootState } from "@/store"
import { ScrollView } from "@/components/ui/scroll-view"
import { supabase } from "@/store/initSupabase"

const { actions } = profileSlice;

const sampleText: string[] = [];
for (let i = 0; i < 100; i++) {
  sampleText.push(i + " good");
}

export default function Settings({ }) {

  const profile = useSelector<RootState, ProfileState>(store => store.profile, shallowEqual);
  const dispatch = useDispatch<AppDispatch>();

  const [saving, setSaving] = useState(false);

  const { points, loading } = profile;

  const onLoad = async () => {
    dispatch(actions.clear());
    dispatch(actions.start());
    let result = await supabase.from('points').select('*', {
      count: 'exact'
    });
    let { data } = result;
    dispatch(actions.insert({points: data}));
  }

  const onSave = async () => {
    setSaving(true);
    await supabase.from('points').delete().neq("id", 0);
    await supabase.from('points').insert(points);
    setSaving(false);
  }

  const onClear = async () => {
    dispatch(actions.clear());
    await supabase.from('points').delete().neq("id", 0);
  }

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Button variant='success' disabled={loading} style={styles.btn} onPress={onLoad}>{loading ? 'Loading' : 'Load'}</Button>
        <Button variant='destructive' disabled={saving} style={styles.btn} onPress={onSave}>{saving ? 'Wait' : 'Save'}</Button>
        <Button variant='secondary' style={styles.btn} onPress={onClear}>Clear</Button>
      </View>
      <Text>{points.length} points loaded.</Text>
      <ScrollView>
        {points.map((value, index) => (<Text key={index}>{JSON.stringify(value)}</Text>))}
      </ScrollView>
    </View>
  )
}

export const styles = StyleSheet.create({
  container: {
    margin: 20,
    marginTop: 40,
    display: 'flex',
  },
  panel: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  btn: {
    margin: 5,
    padding: 5
  }
});