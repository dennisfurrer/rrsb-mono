export declare const Role: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly ADMIN: "ADMIN";
    readonly PARTNER_ADMIN: "PARTNER_ADMIN";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const AssignmentStatus: {
    readonly PENDING: "PENDING";
    readonly CLAIMED: "CLAIMED";
    readonly CANCELLED: "CANCELLED";
    readonly COMPLETED: "COMPLETED";
};
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];
//# sourceMappingURL=enums.d.ts.map