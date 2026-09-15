import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { getProviderBidStats } from '../../../services/bids';
import { getUserProfileById, type StoredUserProfile } from '../../../services/firebaseUser';
import { getProviderReviews, getProviderReviewStats, type ProviderReview } from '../../../services/reviews';
import { useAppTheme } from '../../../theme/AppTheme';
import { LocalizedText as Text } from '../../../localization/AppLocalization';
import { rf } from '../../../utils/responsive';
import PostJobHeader from '../components/PostJobHeader';

type Props = { onBack: () => void; userId: string };

const valueOrDash = (value?: string) => value?.trim() || '—';
const reviewDate = (date?: Date) => date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently';

function UserProfileDetailsScreen({ onBack, userId }: Props) {
  const { colors } = useAppTheme();
  const [profile, setProfile] = useState<StoredUserProfile | null>(null);
  const [bidCount, setBidCount] = useState(0);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUserProfileById(userId).then(async user => {
      if (!user) throw new Error('This user profile is unavailable.');
      if (!active) return;
      setProfile(user);
      if (user.role !== 'provider') return;
      const [bids, reviewStats, receivedReviews] = await Promise.all([getProviderBidStats(user.uid), getProviderReviewStats(user.uid), getProviderReviews(user.uid)]);
      if (!active) return;
      setBidCount(bids.total);
      setRating(reviewStats);
      setReviews(receivedReviews);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load this profile.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const fullName = profile?.fullName?.trim() || 'User profile';
  const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const isProvider = profile?.role === 'provider';

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <PostJobHeader onBack={onBack} title="Profile Details" />
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.state, { color: colors.textMuted }]}>Loading profile...</Text></View>
      : error || !profile ? <View style={styles.center}><Text style={[styles.state, { color: '#DC2626' }]}>{error || 'Profile unavailable.'}</Text></View>
        : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}><Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text></View>
            <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
            {profile.verificationStatus === 'accepted' ? <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View> : null}
            {isProvider ? <View style={styles.stats}><View style={styles.stat}><Text style={[styles.statValue, { color: colors.text }]}>{bidCount}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>Bids</Text></View><View style={styles.stat}><Text style={[styles.statValue, { color: '#F59E0B' }]}>★ {rating.count ? rating.average.toFixed(1) : '—'}</Text><Text style={[styles.statLabel, { color: '#F59E0B' }]}>{rating.count} Reviews</Text></View></View> : null}
          </View>

          {isProvider ? <Section title="Skills"><View style={styles.skillList}>{(profile.skills ?? []).length ? profile.skills?.map(skill => <View key={skill} style={[styles.skill, { backgroundColor: `${colors.primary}16` }]}><Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text></View>) : <Text style={[styles.detail, { color: colors.textMuted }]}>No skills added.</Text>}</View></Section> : null}
          {isProvider ? <Section title={`Reviews (${rating.count})`}>
            {reviews.length ? reviews.map(review => <View key={review.id} style={styles.reviewRow}>
              <View style={styles.reviewTop}><Text style={[styles.reviewerName, { color: colors.text }]}>{review.reviewerName}</Text><Text style={styles.reviewRating}>★ {review.rating.toFixed(1)}</Text></View>
              <Text style={[styles.reviewJob, { color: colors.textMuted }]}>{review.jobTitle} · {reviewDate(review.createdAt)}</Text>
              {review.comment ? <Text style={[styles.reviewComment, { color: colors.textMuted }]}>{review.comment}</Text> : null}
            </View>) : <Text style={[styles.detail, { color: colors.textMuted }]}>No reviews received yet.</Text>}
          </Section> : null}
          <Section title="About"><Text style={[styles.detail, { color: colors.textMuted }]}>{valueOrDash(profile.about)}</Text></Section>
          <Section title="Contact Details"><Detail label="Email" value={profile.email} color={colors.text} /><Detail label="Gender" value={profile.gender} color={colors.text} /></Section>
          <Section title="Location"><Detail label="Address" value={profile.address} color={colors.text} /><Detail label="City" value={profile.city} color={colors.text} /><Detail label="State" value={profile.state} color={colors.text} /></Section>
        </ScrollView>}
  </View>;
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  const { colors } = useAppTheme();
  return <View style={[styles.section, { backgroundColor: colors.card }]}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{children}</View>;
}

function Detail({ color, label, value }: { color: string; label: string; value?: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.detailValue, { color }]}>{valueOrDash(value)}</Text></View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 }, center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 }, content: { padding: 12, paddingBottom: 28 }, detail: { fontSize: rf(11), lineHeight: rf(17) }, detailLabel: { fontSize: rf(9), fontWeight: '600', width: '35%' }, detailRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: 10 }, detailValue: { flex: 1, fontSize: rf(10), lineHeight: rf(15), textAlign: 'right' }, header: { alignItems: 'center', borderRadius: 12, padding: 20 }, initials: { fontSize: rf(25), fontWeight: '800' }, name: { fontSize: rf(18), fontWeight: '800', marginTop: 10 }, reviewerName: { fontSize: rf(11), fontWeight: '800' }, reviewComment: { fontSize: rf(10), lineHeight: rf(15), marginTop: 6 }, reviewJob: { fontSize: rf(9), marginTop: 3 }, reviewRating: { color: '#F59E0B', fontSize: rf(10), fontWeight: '800' }, reviewRow: { borderTopColor: '#E5E7EB', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 11 }, reviewTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, screen: { flex: 1 }, section: { borderRadius: 10, marginTop: 12, padding: 14 }, sectionTitle: { fontSize: rf(13), fontWeight: '800', marginBottom: 3 }, skill: { alignItems: 'center', borderRadius: 15, justifyContent: 'center', minHeight: 30, paddingHorizontal: 13 }, skillList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }, skillText: { fontSize: rf(10), fontWeight: '700', textAlign: 'center' }, stat: { alignItems: 'center', flex: 1 }, statLabel: { fontSize: rf(9), marginTop: 3 }, stats: { flexDirection: 'row', marginTop: 17, width: '75%' }, statValue: { fontSize: rf(14), fontWeight: '800' }, state: { fontSize: rf(12), lineHeight: rf(18), marginTop: 10, textAlign: 'center' }, verifiedBadge: { backgroundColor: '#DCFCE7', borderRadius: 12, marginTop: 7, paddingHorizontal: 10, paddingVertical: 4 }, verifiedText: { color: '#15803D', fontSize: rf(9), fontWeight: '800' },
});

export default UserProfileDetailsScreen;
