import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { getCachedUserProfile } from '../../../services/firebaseUser';
import { getProviderReviews, getProviderReviewStats, type ProviderReview } from '../../../services/reviews';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type Props = { onBack: () => void; onOpenUser: (userId: string) => void };

const dateLabel = (date?: Date) => date
  ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'Just now';

function MyReviewsScreen({ onBack, onOpenUser }: Props) {
  const { colors } = useAppTheme();
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCachedUserProfile().then(async profile => {
      if (profile?.role !== 'provider' || !profile.uid) return;
      const [items, stats] = await Promise.all([getProviderReviews(profile.uid), getProviderReviewStats(profile.uid)]);
      if (!active) return;
      setReviews(items);
      setAverage(stats.average);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load your reviews.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <PostJobHeader onBack={onBack} title="My Reviews" />
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.state, { color: colors.textMuted }]}>Loading reviews...</Text></View>
      : error ? <View style={styles.center}><Text style={[styles.state, { color: '#DC2626' }]}>{error}</Text></View>
        : <FlatList
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={reviews.length ? styles.content : styles.emptyContent}
          ListHeaderComponent={<View style={[styles.summary, { backgroundColor: colors.card }]}><Text style={styles.bigStar}>★</Text><View><Text style={[styles.average, { color: colors.text }]}>{average.toFixed(1)}</Text><Text style={[styles.summaryText, { color: colors.textMuted }]}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</Text></View></View>}
          ListEmptyComponent={<Text style={[styles.state, { color: colors.textMuted }]}>You have not received any reviews yet.</Text>}
          renderItem={({ item }) => <Pressable accessibilityRole="button" disabled={!item.reviewerId} onPress={() => onOpenUser(item.reviewerId)} style={[styles.reviewCard, { backgroundColor: colors.card }]}>
            <View style={styles.reviewTop}><View style={[styles.initial, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.initialText, { color: colors.primary }]}>{item.reviewerName.charAt(0).toUpperCase()}</Text></View><View style={styles.reviewCopy}><Text style={[styles.reviewerName, { color: colors.text }]}>{item.reviewerName}</Text><Text style={[styles.jobTitle, { color: colors.textMuted }]} numberOfLines={1}>{item.jobTitle}</Text></View><View style={styles.rating}><Text style={styles.ratingStar}>★</Text><Text style={[styles.ratingValue, { color: colors.text }]}>{item.rating.toFixed(1)}</Text></View></View>
            {item.comment ? <Text style={[styles.comment, { color: colors.textMuted }]}>{item.comment}</Text> : null}
            <Text style={[styles.date, { color: colors.textMuted }]}>{dateLabel(item.createdAt)}</Text>
          </Pressable>}
        />}
  </View>;
}

const styles = StyleSheet.create({
  average: { fontSize: rf(24), fontWeight: '800' }, bigStar: { color: '#F59E0B', fontSize: rf(32), marginRight: 12 }, center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 }, comment: { fontSize: rf(11), lineHeight: rf(16), marginTop: 12 }, content: { padding: 12, paddingBottom: 24 }, date: { fontSize: rf(9), marginTop: 10 }, emptyContent: { flexGrow: 1, justifyContent: 'center', padding: 28 }, initial: { alignItems: 'center', borderRadius: 19, height: 38, justifyContent: 'center', width: 38 }, initialText: { fontSize: rf(14), fontWeight: '800' }, jobTitle: { fontSize: rf(9), marginTop: 3 }, rating: { alignItems: 'center', flexDirection: 'row' }, ratingStar: { color: '#F59E0B', fontSize: rf(14), marginRight: 3 }, ratingValue: { fontSize: rf(11), fontWeight: '800' }, reviewCard: { borderRadius: 10, elevation: 1, marginTop: 10, padding: 13, shadowColor: '#64748B', shadowOffset: { height: 1, width: 0 }, shadowOpacity: 0.07, shadowRadius: 3 }, reviewCopy: { flex: 1, marginLeft: 10 }, reviewTop: { alignItems: 'center', flexDirection: 'row' }, reviewerName: { fontSize: rf(12), fontWeight: '800' }, screen: { flex: 1 }, state: { fontSize: rf(12), lineHeight: rf(18), textAlign: 'center' }, summary: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', marginBottom: 4, padding: 15 }, summaryText: { fontSize: rf(10), marginTop: 2 },
});

export default MyReviewsScreen;
