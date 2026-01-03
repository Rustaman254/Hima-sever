import { Share2, ArrowUpRight, Clock, ChevronDown, Repeat } from "lucide-react";
// @ts-ignore
import styles from "./detail-card.module.css";

export function ActivePositionCard({ policy }: { policy?: any }) {
    const isMock = !policy;

    return (
        <div className={styles.detailCard}>
            <div className={styles.topRow}>
                <div className={styles.positionInfo}>
                    <div className={styles.lastUpdate}>
                        {isMock ? "Scanning Mantle Network..." : "Policy Status: Active"} <Clock size={12} />
                    </div>

                    <h2 className={styles.positionName}>
                        {isMock ? "Pool: Boda-Boda Mutual" : `Policy: ${policy.coverage.toUpperCase()}`}
                        <span style={{ background: '#10b981', padding: '0.25rem', borderRadius: '4px', fontSize: '0.75rem' }}>✓</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '50%' }}><Share2 size={14} /></div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '50%' }}><ArrowUpRight size={14} /></div>
                        </div>
                    </h2>

                    <p className={styles.balanceLabel}>{isMock ? "Liquidity Share" : "Premium Amount"}</p>
                    <div className={styles.balanceValue}>
                        {isMock ? "1.25" : policy.premium}
                        <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 400 }}>{isMock ? "ETH" : "USD"}</span>
                    </div>

                    <p className={styles.balanceLabel} style={{ marginTop: '0.5rem' }}>{isMock ? "Active Riders" : "Valid Until"}</p>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {isMock ? "1,240" : new Date(policy.endDate).toLocaleDateString()}
                    </div>

                    <div className={styles.actionButtons}>
                        <button className={styles.upgradeBtn}>Upgrade</button>
                        <button className={styles.unstakeBtn}>Unstake</button>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Maturity Progress</span>
                        <span style={{
                            background: policy?.isClaimable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: policy?.isClaimable ? '#10b981' : '#f59e0b',
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem'
                        }}>
                            {policy?.isClaimable ? "Matured" : "Maturing..."}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {policy?.isClaimable ? "Policy is now claimable" : `Matures on: ${new Date(policy?.maturityDate || Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}`}
                    </p>

                    <div className={styles.periodVisual}>
                        {(() => {
                            const start = new Date(policy?.policyStartDate || Date.now()).getTime();
                            const maturity = new Date(policy?.maturityDate || (Date.now() + 180 * 24 * 60 * 60 * 1000)).getTime();
                            const now = Date.now();
                            const progress = Math.min(Math.max(((now - start) / (maturity - start)) * 100, 0), 100);

                            return (
                                <>
                                    <div style={{ position: 'absolute', left: `${progress}%`, top: '-20px', background: '#4c1d95', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', transform: 'translateX(-50%)' }}>
                                        {Math.round(progress)}%
                                    </div>
                                    <div style={{ width: '100%', height: '2px', background: '#334155' }}></div>
                                    <div style={{ width: `${progress}%`, height: '2px', background: '#a78bfa', position: 'absolute', left: 0 }}></div>
                                    <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', position: 'absolute', left: `${progress}%`, border: '4px solid #7c3aed', transform: 'translate(-50%, -5px)' }}></div>
                                </>
                            );
                        })()}

                        <div style={{ position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between', opacity: 0.3 }}>
                            {[...Array(20)].map((_, i) => (
                                <div key={i} style={{ width: '2px', height: `${Math.random() * 20 + 10}px`, background: '#8b5cf6' }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4>Momentum</h4>
                        <ChevronDown size={14} color="#6B7280" />
                    </div>
                    <p>Growth dynamics</p>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4>General</h4>
                        <ChevronDown size={14} color="#6B7280" />
                    </div>
                    <p>Overview</p>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4>Risk</h4>
                        <ChevronDown size={14} color="#6B7280" />
                    </div>
                    <p>Risk assessment</p>
                </div>
                <div className={styles.statItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4>Reward</h4>
                        <ChevronDown size={14} color="#6B7280" />
                    </div>
                    <p>Expected profit</p>
                </div>
            </div>

            <div className={styles.metricsRow}>
                <div className={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        <span>Staked Tokens Trend</span>
                        <span style={{ background: '#334155', padding: '0 4px', borderRadius: '2px' }}>24H</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>-0.82%</div>
                </div>
                <div className={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        <span>Price</span>
                        <span style={{ background: '#334155', padding: '0 4px', borderRadius: '2px' }}>24H</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>$41.99 <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>-1.09%</span></div>
                </div>
                <div className={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        <span>Staking Ratio</span>
                        <span style={{ background: '#334155', padding: '0 4px', borderRadius: '2px' }}>24H</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>60.6%</div>
                </div>
                <div className={styles.metricCard} style={{ flex: 1.5 }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Reward Rate</div>
                    <div style={{ height: '4px', background: '#334155', borderRadius: '2px', position: 'relative', marginTop: '1rem' }}>
                        <div style={{ position: 'absolute', width: '70%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #c084fc)', borderRadius: '2px' }}></div>
                        <div style={{ position: 'absolute', right: '0', top: '-1.5rem', fontSize: '0.65rem', color: '#9CA3AF' }}>2.23% <span style={{ opacity: 0.5 }}>24H Ago</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
