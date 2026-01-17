"use client";

import { Zap, Shield, Search, MoreVertical, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
// @ts-ignore
import tableStyles from "@/components/dashboard/tables.module.css";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";

export default function AdminActivePolicies() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchPolicies = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/insurance/admin/policies`);
            const data = await res.json();
            if (data.success) {
                setPolicies(data.policies);
            }
        } catch (error) {
            console.error("Failed to fetch:", error);
            toast.error("Could not fetch policies");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const toggleClaimable = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        toast.loading(`Updating policy claimability...`);
        try {
            const res = await fetch(`${API_BASE_URL}/api/insurance/admin/policies/${id}/claimable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isClaimable: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast.dismiss();
                toast.success(`Policy is now ${newStatus ? 'claimable' : 'not claimable'}`);
                fetchPolicies();
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Update failed");
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.phoneNumber?.includes(search)
    );

    return (
        <div>
            <div className={tableStyles.searchHeader}>
                <div className={tableStyles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by policy number, name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className={tableStyles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" color="#8b5cf6" size={40} style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading active policies...</p>
                    </div>
                ) : filteredPolicies.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '2rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p style={{ color: '#64748b' }}>No active policies found.</p>
                    </div>
                ) : (
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th className={tableStyles.th}>Policy ID</th>
                                <th className={tableStyles.th}>Policy Holder</th>
                                <th className={tableStyles.th}>Coverage</th>
                                <th className={tableStyles.th}>Premium</th>
                                <th className={tableStyles.th}>Maturity Date</th>
                                <th className={tableStyles.th}>Claimable</th>
                                <th className={tableStyles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPolicies.map((policy) => (
                                <tr key={policy._id} className={tableStyles.tr}>
                                    <td className={tableStyles.td} style={{ color: '#8b5cf6', fontWeight: 700 }}>{policy.policyNumber}</td>
                                    <td className={tableStyles.td}>
                                        <div style={{ fontWeight: 600 }}>{policy.user?.firstName} {policy.user?.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>+{policy.user?.phoneNumber}</div>
                                    </td>
                                    <td className={tableStyles.td}>{policy.coverageType?.toUpperCase()}</td>
                                    <td className={tableStyles.td}>KES {policy.premiumAmount?.toLocaleString()}</td>
                                    <td className={tableStyles.td}>{new Date(policy.maturityDate).toLocaleDateString()}</td>
                                    <td className={tableStyles.td}>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: policy.isClaimable ? '#10b981' : '#f59e0b',
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }}>
                                            <Zap size={14} fill={policy.isClaimable ? "#10b981" : "transparent"} />
                                            {policy.isClaimable ? "Yes" : "Waiting"}
                                        </span>
                                    </td>
                                    <td className={tableStyles.td}>
                                        <button
                                            onClick={() => toggleClaimable(policy._id, policy.isClaimable)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: policy.isClaimable ? '#ef4444' : '#10b981' }}
                                            title={policy.isClaimable ? "Revoke Claimable Status" : "Make Claimable Now"}
                                        >
                                            {policy.isClaimable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
