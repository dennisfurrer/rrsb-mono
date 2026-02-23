import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model MatchAssignment
 *
 */
export type MatchAssignmentModel = runtime.Types.Result.DefaultSelection<Prisma.$MatchAssignmentPayload>;
export type AggregateMatchAssignment = {
    _count: MatchAssignmentCountAggregateOutputType | null;
    _avg: MatchAssignmentAvgAggregateOutputType | null;
    _sum: MatchAssignmentSumAggregateOutputType | null;
    _min: MatchAssignmentMinAggregateOutputType | null;
    _max: MatchAssignmentMaxAggregateOutputType | null;
};
export type MatchAssignmentAvgAggregateOutputType = {
    bestOf: number | null;
    handicap: number | null;
    tableNumber: number | null;
};
export type MatchAssignmentSumAggregateOutputType = {
    bestOf: number | null;
    handicap: number | null;
    tableNumber: number | null;
};
export type MatchAssignmentMinAggregateOutputType = {
    id: string | null;
    player1Name: string | null;
    player2Name: string | null;
    bestOf: number | null;
    handicap: number | null;
    deviceId: string | null;
    tableNumber: number | null;
    status: $Enums.AssignmentStatus | null;
    createdAt: Date | null;
};
export type MatchAssignmentMaxAggregateOutputType = {
    id: string | null;
    player1Name: string | null;
    player2Name: string | null;
    bestOf: number | null;
    handicap: number | null;
    deviceId: string | null;
    tableNumber: number | null;
    status: $Enums.AssignmentStatus | null;
    createdAt: Date | null;
};
export type MatchAssignmentCountAggregateOutputType = {
    id: number;
    player1Name: number;
    player2Name: number;
    bestOf: number;
    handicap: number;
    deviceId: number;
    tableNumber: number;
    status: number;
    createdAt: number;
    _all: number;
};
export type MatchAssignmentAvgAggregateInputType = {
    bestOf?: true;
    handicap?: true;
    tableNumber?: true;
};
export type MatchAssignmentSumAggregateInputType = {
    bestOf?: true;
    handicap?: true;
    tableNumber?: true;
};
export type MatchAssignmentMinAggregateInputType = {
    id?: true;
    player1Name?: true;
    player2Name?: true;
    bestOf?: true;
    handicap?: true;
    deviceId?: true;
    tableNumber?: true;
    status?: true;
    createdAt?: true;
};
export type MatchAssignmentMaxAggregateInputType = {
    id?: true;
    player1Name?: true;
    player2Name?: true;
    bestOf?: true;
    handicap?: true;
    deviceId?: true;
    tableNumber?: true;
    status?: true;
    createdAt?: true;
};
export type MatchAssignmentCountAggregateInputType = {
    id?: true;
    player1Name?: true;
    player2Name?: true;
    bestOf?: true;
    handicap?: true;
    deviceId?: true;
    tableNumber?: true;
    status?: true;
    createdAt?: true;
    _all?: true;
};
export type MatchAssignmentAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which MatchAssignment to aggregate.
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MatchAssignments to fetch.
     */
    orderBy?: Prisma.MatchAssignmentOrderByWithRelationInput | Prisma.MatchAssignmentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.MatchAssignmentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MatchAssignments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MatchAssignments.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned MatchAssignments
    **/
    _count?: true | MatchAssignmentCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: MatchAssignmentAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: MatchAssignmentSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: MatchAssignmentMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: MatchAssignmentMaxAggregateInputType;
};
export type GetMatchAssignmentAggregateType<T extends MatchAssignmentAggregateArgs> = {
    [P in keyof T & keyof AggregateMatchAssignment]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMatchAssignment[P]> : Prisma.GetScalarType<T[P], AggregateMatchAssignment[P]>;
};
export type MatchAssignmentGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MatchAssignmentWhereInput;
    orderBy?: Prisma.MatchAssignmentOrderByWithAggregationInput | Prisma.MatchAssignmentOrderByWithAggregationInput[];
    by: Prisma.MatchAssignmentScalarFieldEnum[] | Prisma.MatchAssignmentScalarFieldEnum;
    having?: Prisma.MatchAssignmentScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MatchAssignmentCountAggregateInputType | true;
    _avg?: MatchAssignmentAvgAggregateInputType;
    _sum?: MatchAssignmentSumAggregateInputType;
    _min?: MatchAssignmentMinAggregateInputType;
    _max?: MatchAssignmentMaxAggregateInputType;
};
export type MatchAssignmentGroupByOutputType = {
    id: string;
    player1Name: string;
    player2Name: string;
    bestOf: number;
    handicap: number | null;
    deviceId: string | null;
    tableNumber: number | null;
    status: $Enums.AssignmentStatus;
    createdAt: Date;
    _count: MatchAssignmentCountAggregateOutputType | null;
    _avg: MatchAssignmentAvgAggregateOutputType | null;
    _sum: MatchAssignmentSumAggregateOutputType | null;
    _min: MatchAssignmentMinAggregateOutputType | null;
    _max: MatchAssignmentMaxAggregateOutputType | null;
};
type GetMatchAssignmentGroupByPayload<T extends MatchAssignmentGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MatchAssignmentGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MatchAssignmentGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MatchAssignmentGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MatchAssignmentGroupByOutputType[P]>;
}>>;
export type MatchAssignmentWhereInput = {
    AND?: Prisma.MatchAssignmentWhereInput | Prisma.MatchAssignmentWhereInput[];
    OR?: Prisma.MatchAssignmentWhereInput[];
    NOT?: Prisma.MatchAssignmentWhereInput | Prisma.MatchAssignmentWhereInput[];
    id?: Prisma.StringFilter<"MatchAssignment"> | string;
    player1Name?: Prisma.StringFilter<"MatchAssignment"> | string;
    player2Name?: Prisma.StringFilter<"MatchAssignment"> | string;
    bestOf?: Prisma.IntFilter<"MatchAssignment"> | number;
    handicap?: Prisma.IntNullableFilter<"MatchAssignment"> | number | null;
    deviceId?: Prisma.StringNullableFilter<"MatchAssignment"> | string | null;
    tableNumber?: Prisma.IntNullableFilter<"MatchAssignment"> | number | null;
    status?: Prisma.EnumAssignmentStatusFilter<"MatchAssignment"> | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeFilter<"MatchAssignment"> | Date | string;
};
export type MatchAssignmentOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    player1Name?: Prisma.SortOrder;
    player2Name?: Prisma.SortOrder;
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrderInput | Prisma.SortOrder;
    deviceId?: Prisma.SortOrderInput | Prisma.SortOrder;
    tableNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MatchAssignmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.MatchAssignmentWhereInput | Prisma.MatchAssignmentWhereInput[];
    OR?: Prisma.MatchAssignmentWhereInput[];
    NOT?: Prisma.MatchAssignmentWhereInput | Prisma.MatchAssignmentWhereInput[];
    player1Name?: Prisma.StringFilter<"MatchAssignment"> | string;
    player2Name?: Prisma.StringFilter<"MatchAssignment"> | string;
    bestOf?: Prisma.IntFilter<"MatchAssignment"> | number;
    handicap?: Prisma.IntNullableFilter<"MatchAssignment"> | number | null;
    deviceId?: Prisma.StringNullableFilter<"MatchAssignment"> | string | null;
    tableNumber?: Prisma.IntNullableFilter<"MatchAssignment"> | number | null;
    status?: Prisma.EnumAssignmentStatusFilter<"MatchAssignment"> | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeFilter<"MatchAssignment"> | Date | string;
}, "id">;
export type MatchAssignmentOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    player1Name?: Prisma.SortOrder;
    player2Name?: Prisma.SortOrder;
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrderInput | Prisma.SortOrder;
    deviceId?: Prisma.SortOrderInput | Prisma.SortOrder;
    tableNumber?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.MatchAssignmentCountOrderByAggregateInput;
    _avg?: Prisma.MatchAssignmentAvgOrderByAggregateInput;
    _max?: Prisma.MatchAssignmentMaxOrderByAggregateInput;
    _min?: Prisma.MatchAssignmentMinOrderByAggregateInput;
    _sum?: Prisma.MatchAssignmentSumOrderByAggregateInput;
};
export type MatchAssignmentScalarWhereWithAggregatesInput = {
    AND?: Prisma.MatchAssignmentScalarWhereWithAggregatesInput | Prisma.MatchAssignmentScalarWhereWithAggregatesInput[];
    OR?: Prisma.MatchAssignmentScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MatchAssignmentScalarWhereWithAggregatesInput | Prisma.MatchAssignmentScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"MatchAssignment"> | string;
    player1Name?: Prisma.StringWithAggregatesFilter<"MatchAssignment"> | string;
    player2Name?: Prisma.StringWithAggregatesFilter<"MatchAssignment"> | string;
    bestOf?: Prisma.IntWithAggregatesFilter<"MatchAssignment"> | number;
    handicap?: Prisma.IntNullableWithAggregatesFilter<"MatchAssignment"> | number | null;
    deviceId?: Prisma.StringNullableWithAggregatesFilter<"MatchAssignment"> | string | null;
    tableNumber?: Prisma.IntNullableWithAggregatesFilter<"MatchAssignment"> | number | null;
    status?: Prisma.EnumAssignmentStatusWithAggregatesFilter<"MatchAssignment"> | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"MatchAssignment"> | Date | string;
};
export type MatchAssignmentCreateInput = {
    id?: string;
    player1Name: string;
    player2Name: string;
    bestOf: number;
    handicap?: number | null;
    deviceId?: string | null;
    tableNumber?: number | null;
    status?: $Enums.AssignmentStatus;
    createdAt?: Date | string;
};
export type MatchAssignmentUncheckedCreateInput = {
    id?: string;
    player1Name: string;
    player2Name: string;
    bestOf: number;
    handicap?: number | null;
    deviceId?: string | null;
    tableNumber?: number | null;
    status?: $Enums.AssignmentStatus;
    createdAt?: Date | string;
};
export type MatchAssignmentUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    player1Name?: Prisma.StringFieldUpdateOperationsInput | string;
    player2Name?: Prisma.StringFieldUpdateOperationsInput | string;
    bestOf?: Prisma.IntFieldUpdateOperationsInput | number;
    handicap?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    deviceId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tableNumber?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumAssignmentStatusFieldUpdateOperationsInput | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MatchAssignmentUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    player1Name?: Prisma.StringFieldUpdateOperationsInput | string;
    player2Name?: Prisma.StringFieldUpdateOperationsInput | string;
    bestOf?: Prisma.IntFieldUpdateOperationsInput | number;
    handicap?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    deviceId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tableNumber?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumAssignmentStatusFieldUpdateOperationsInput | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MatchAssignmentCreateManyInput = {
    id?: string;
    player1Name: string;
    player2Name: string;
    bestOf: number;
    handicap?: number | null;
    deviceId?: string | null;
    tableNumber?: number | null;
    status?: $Enums.AssignmentStatus;
    createdAt?: Date | string;
};
export type MatchAssignmentUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    player1Name?: Prisma.StringFieldUpdateOperationsInput | string;
    player2Name?: Prisma.StringFieldUpdateOperationsInput | string;
    bestOf?: Prisma.IntFieldUpdateOperationsInput | number;
    handicap?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    deviceId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tableNumber?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumAssignmentStatusFieldUpdateOperationsInput | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MatchAssignmentUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    player1Name?: Prisma.StringFieldUpdateOperationsInput | string;
    player2Name?: Prisma.StringFieldUpdateOperationsInput | string;
    bestOf?: Prisma.IntFieldUpdateOperationsInput | number;
    handicap?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    deviceId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    tableNumber?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    status?: Prisma.EnumAssignmentStatusFieldUpdateOperationsInput | $Enums.AssignmentStatus;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MatchAssignmentCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    player1Name?: Prisma.SortOrder;
    player2Name?: Prisma.SortOrder;
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrder;
    deviceId?: Prisma.SortOrder;
    tableNumber?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MatchAssignmentAvgOrderByAggregateInput = {
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrder;
    tableNumber?: Prisma.SortOrder;
};
export type MatchAssignmentMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    player1Name?: Prisma.SortOrder;
    player2Name?: Prisma.SortOrder;
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrder;
    deviceId?: Prisma.SortOrder;
    tableNumber?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MatchAssignmentMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    player1Name?: Prisma.SortOrder;
    player2Name?: Prisma.SortOrder;
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrder;
    deviceId?: Prisma.SortOrder;
    tableNumber?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MatchAssignmentSumOrderByAggregateInput = {
    bestOf?: Prisma.SortOrder;
    handicap?: Prisma.SortOrder;
    tableNumber?: Prisma.SortOrder;
};
export type EnumAssignmentStatusFieldUpdateOperationsInput = {
    set?: $Enums.AssignmentStatus;
};
export type MatchAssignmentSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    player1Name?: boolean;
    player2Name?: boolean;
    bestOf?: boolean;
    handicap?: boolean;
    deviceId?: boolean;
    tableNumber?: boolean;
    status?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["matchAssignment"]>;
export type MatchAssignmentSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    player1Name?: boolean;
    player2Name?: boolean;
    bestOf?: boolean;
    handicap?: boolean;
    deviceId?: boolean;
    tableNumber?: boolean;
    status?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["matchAssignment"]>;
export type MatchAssignmentSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    player1Name?: boolean;
    player2Name?: boolean;
    bestOf?: boolean;
    handicap?: boolean;
    deviceId?: boolean;
    tableNumber?: boolean;
    status?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["matchAssignment"]>;
export type MatchAssignmentSelectScalar = {
    id?: boolean;
    player1Name?: boolean;
    player2Name?: boolean;
    bestOf?: boolean;
    handicap?: boolean;
    deviceId?: boolean;
    tableNumber?: boolean;
    status?: boolean;
    createdAt?: boolean;
};
export type MatchAssignmentOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "player1Name" | "player2Name" | "bestOf" | "handicap" | "deviceId" | "tableNumber" | "status" | "createdAt", ExtArgs["result"]["matchAssignment"]>;
export type $MatchAssignmentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "MatchAssignment";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        player1Name: string;
        player2Name: string;
        bestOf: number;
        handicap: number | null;
        deviceId: string | null;
        tableNumber: number | null;
        status: $Enums.AssignmentStatus;
        createdAt: Date;
    }, ExtArgs["result"]["matchAssignment"]>;
    composites: {};
};
export type MatchAssignmentGetPayload<S extends boolean | null | undefined | MatchAssignmentDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload, S>;
export type MatchAssignmentCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MatchAssignmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MatchAssignmentCountAggregateInputType | true;
};
export interface MatchAssignmentDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['MatchAssignment'];
        meta: {
            name: 'MatchAssignment';
        };
    };
    /**
     * Find zero or one MatchAssignment that matches the filter.
     * @param {MatchAssignmentFindUniqueArgs} args - Arguments to find a MatchAssignment
     * @example
     * // Get one MatchAssignment
     * const matchAssignment = await prisma.matchAssignment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MatchAssignmentFindUniqueArgs>(args: Prisma.SelectSubset<T, MatchAssignmentFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one MatchAssignment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MatchAssignmentFindUniqueOrThrowArgs} args - Arguments to find a MatchAssignment
     * @example
     * // Get one MatchAssignment
     * const matchAssignment = await prisma.matchAssignment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MatchAssignmentFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MatchAssignmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first MatchAssignment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentFindFirstArgs} args - Arguments to find a MatchAssignment
     * @example
     * // Get one MatchAssignment
     * const matchAssignment = await prisma.matchAssignment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MatchAssignmentFindFirstArgs>(args?: Prisma.SelectSubset<T, MatchAssignmentFindFirstArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first MatchAssignment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentFindFirstOrThrowArgs} args - Arguments to find a MatchAssignment
     * @example
     * // Get one MatchAssignment
     * const matchAssignment = await prisma.matchAssignment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MatchAssignmentFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MatchAssignmentFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more MatchAssignments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MatchAssignments
     * const matchAssignments = await prisma.matchAssignment.findMany()
     *
     * // Get first 10 MatchAssignments
     * const matchAssignments = await prisma.matchAssignment.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const matchAssignmentWithIdOnly = await prisma.matchAssignment.findMany({ select: { id: true } })
     *
     */
    findMany<T extends MatchAssignmentFindManyArgs>(args?: Prisma.SelectSubset<T, MatchAssignmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a MatchAssignment.
     * @param {MatchAssignmentCreateArgs} args - Arguments to create a MatchAssignment.
     * @example
     * // Create one MatchAssignment
     * const MatchAssignment = await prisma.matchAssignment.create({
     *   data: {
     *     // ... data to create a MatchAssignment
     *   }
     * })
     *
     */
    create<T extends MatchAssignmentCreateArgs>(args: Prisma.SelectSubset<T, MatchAssignmentCreateArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many MatchAssignments.
     * @param {MatchAssignmentCreateManyArgs} args - Arguments to create many MatchAssignments.
     * @example
     * // Create many MatchAssignments
     * const matchAssignment = await prisma.matchAssignment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends MatchAssignmentCreateManyArgs>(args?: Prisma.SelectSubset<T, MatchAssignmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many MatchAssignments and returns the data saved in the database.
     * @param {MatchAssignmentCreateManyAndReturnArgs} args - Arguments to create many MatchAssignments.
     * @example
     * // Create many MatchAssignments
     * const matchAssignment = await prisma.matchAssignment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many MatchAssignments and only return the `id`
     * const matchAssignmentWithIdOnly = await prisma.matchAssignment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends MatchAssignmentCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MatchAssignmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a MatchAssignment.
     * @param {MatchAssignmentDeleteArgs} args - Arguments to delete one MatchAssignment.
     * @example
     * // Delete one MatchAssignment
     * const MatchAssignment = await prisma.matchAssignment.delete({
     *   where: {
     *     // ... filter to delete one MatchAssignment
     *   }
     * })
     *
     */
    delete<T extends MatchAssignmentDeleteArgs>(args: Prisma.SelectSubset<T, MatchAssignmentDeleteArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one MatchAssignment.
     * @param {MatchAssignmentUpdateArgs} args - Arguments to update one MatchAssignment.
     * @example
     * // Update one MatchAssignment
     * const matchAssignment = await prisma.matchAssignment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends MatchAssignmentUpdateArgs>(args: Prisma.SelectSubset<T, MatchAssignmentUpdateArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more MatchAssignments.
     * @param {MatchAssignmentDeleteManyArgs} args - Arguments to filter MatchAssignments to delete.
     * @example
     * // Delete a few MatchAssignments
     * const { count } = await prisma.matchAssignment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends MatchAssignmentDeleteManyArgs>(args?: Prisma.SelectSubset<T, MatchAssignmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more MatchAssignments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MatchAssignments
     * const matchAssignment = await prisma.matchAssignment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends MatchAssignmentUpdateManyArgs>(args: Prisma.SelectSubset<T, MatchAssignmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more MatchAssignments and returns the data updated in the database.
     * @param {MatchAssignmentUpdateManyAndReturnArgs} args - Arguments to update many MatchAssignments.
     * @example
     * // Update many MatchAssignments
     * const matchAssignment = await prisma.matchAssignment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more MatchAssignments and only return the `id`
     * const matchAssignmentWithIdOnly = await prisma.matchAssignment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends MatchAssignmentUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MatchAssignmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one MatchAssignment.
     * @param {MatchAssignmentUpsertArgs} args - Arguments to update or create a MatchAssignment.
     * @example
     * // Update or create a MatchAssignment
     * const matchAssignment = await prisma.matchAssignment.upsert({
     *   create: {
     *     // ... data to create a MatchAssignment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MatchAssignment we want to update
     *   }
     * })
     */
    upsert<T extends MatchAssignmentUpsertArgs>(args: Prisma.SelectSubset<T, MatchAssignmentUpsertArgs<ExtArgs>>): Prisma.Prisma__MatchAssignmentClient<runtime.Types.Result.GetResult<Prisma.$MatchAssignmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of MatchAssignments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentCountArgs} args - Arguments to filter MatchAssignments to count.
     * @example
     * // Count the number of MatchAssignments
     * const count = await prisma.matchAssignment.count({
     *   where: {
     *     // ... the filter for the MatchAssignments we want to count
     *   }
     * })
    **/
    count<T extends MatchAssignmentCountArgs>(args?: Prisma.Subset<T, MatchAssignmentCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MatchAssignmentCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a MatchAssignment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MatchAssignmentAggregateArgs>(args: Prisma.Subset<T, MatchAssignmentAggregateArgs>): Prisma.PrismaPromise<GetMatchAssignmentAggregateType<T>>;
    /**
     * Group by MatchAssignment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MatchAssignmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends MatchAssignmentGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MatchAssignmentGroupByArgs['orderBy'];
    } : {
        orderBy?: MatchAssignmentGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MatchAssignmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMatchAssignmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the MatchAssignment model
     */
    readonly fields: MatchAssignmentFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for MatchAssignment.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__MatchAssignmentClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the MatchAssignment model
 */
export interface MatchAssignmentFieldRefs {
    readonly id: Prisma.FieldRef<"MatchAssignment", 'String'>;
    readonly player1Name: Prisma.FieldRef<"MatchAssignment", 'String'>;
    readonly player2Name: Prisma.FieldRef<"MatchAssignment", 'String'>;
    readonly bestOf: Prisma.FieldRef<"MatchAssignment", 'Int'>;
    readonly handicap: Prisma.FieldRef<"MatchAssignment", 'Int'>;
    readonly deviceId: Prisma.FieldRef<"MatchAssignment", 'String'>;
    readonly tableNumber: Prisma.FieldRef<"MatchAssignment", 'Int'>;
    readonly status: Prisma.FieldRef<"MatchAssignment", 'AssignmentStatus'>;
    readonly createdAt: Prisma.FieldRef<"MatchAssignment", 'DateTime'>;
}
/**
 * MatchAssignment findUnique
 */
export type MatchAssignmentFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * Filter, which MatchAssignment to fetch.
     */
    where: Prisma.MatchAssignmentWhereUniqueInput;
};
/**
 * MatchAssignment findUniqueOrThrow
 */
export type MatchAssignmentFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * Filter, which MatchAssignment to fetch.
     */
    where: Prisma.MatchAssignmentWhereUniqueInput;
};
/**
 * MatchAssignment findFirst
 */
export type MatchAssignmentFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * Filter, which MatchAssignment to fetch.
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MatchAssignments to fetch.
     */
    orderBy?: Prisma.MatchAssignmentOrderByWithRelationInput | Prisma.MatchAssignmentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for MatchAssignments.
     */
    cursor?: Prisma.MatchAssignmentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MatchAssignments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MatchAssignments.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MatchAssignments.
     */
    distinct?: Prisma.MatchAssignmentScalarFieldEnum | Prisma.MatchAssignmentScalarFieldEnum[];
};
/**
 * MatchAssignment findFirstOrThrow
 */
export type MatchAssignmentFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * Filter, which MatchAssignment to fetch.
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MatchAssignments to fetch.
     */
    orderBy?: Prisma.MatchAssignmentOrderByWithRelationInput | Prisma.MatchAssignmentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for MatchAssignments.
     */
    cursor?: Prisma.MatchAssignmentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MatchAssignments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MatchAssignments.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MatchAssignments.
     */
    distinct?: Prisma.MatchAssignmentScalarFieldEnum | Prisma.MatchAssignmentScalarFieldEnum[];
};
/**
 * MatchAssignment findMany
 */
export type MatchAssignmentFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * Filter, which MatchAssignments to fetch.
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MatchAssignments to fetch.
     */
    orderBy?: Prisma.MatchAssignmentOrderByWithRelationInput | Prisma.MatchAssignmentOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing MatchAssignments.
     */
    cursor?: Prisma.MatchAssignmentWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MatchAssignments from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MatchAssignments.
     */
    skip?: number;
    distinct?: Prisma.MatchAssignmentScalarFieldEnum | Prisma.MatchAssignmentScalarFieldEnum[];
};
/**
 * MatchAssignment create
 */
export type MatchAssignmentCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * The data needed to create a MatchAssignment.
     */
    data: Prisma.XOR<Prisma.MatchAssignmentCreateInput, Prisma.MatchAssignmentUncheckedCreateInput>;
};
/**
 * MatchAssignment createMany
 */
export type MatchAssignmentCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many MatchAssignments.
     */
    data: Prisma.MatchAssignmentCreateManyInput | Prisma.MatchAssignmentCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * MatchAssignment createManyAndReturn
 */
export type MatchAssignmentCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * The data used to create many MatchAssignments.
     */
    data: Prisma.MatchAssignmentCreateManyInput | Prisma.MatchAssignmentCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * MatchAssignment update
 */
export type MatchAssignmentUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * The data needed to update a MatchAssignment.
     */
    data: Prisma.XOR<Prisma.MatchAssignmentUpdateInput, Prisma.MatchAssignmentUncheckedUpdateInput>;
    /**
     * Choose, which MatchAssignment to update.
     */
    where: Prisma.MatchAssignmentWhereUniqueInput;
};
/**
 * MatchAssignment updateMany
 */
export type MatchAssignmentUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update MatchAssignments.
     */
    data: Prisma.XOR<Prisma.MatchAssignmentUpdateManyMutationInput, Prisma.MatchAssignmentUncheckedUpdateManyInput>;
    /**
     * Filter which MatchAssignments to update
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * Limit how many MatchAssignments to update.
     */
    limit?: number;
};
/**
 * MatchAssignment updateManyAndReturn
 */
export type MatchAssignmentUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * The data used to update MatchAssignments.
     */
    data: Prisma.XOR<Prisma.MatchAssignmentUpdateManyMutationInput, Prisma.MatchAssignmentUncheckedUpdateManyInput>;
    /**
     * Filter which MatchAssignments to update
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * Limit how many MatchAssignments to update.
     */
    limit?: number;
};
/**
 * MatchAssignment upsert
 */
export type MatchAssignmentUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * The filter to search for the MatchAssignment to update in case it exists.
     */
    where: Prisma.MatchAssignmentWhereUniqueInput;
    /**
     * In case the MatchAssignment found by the `where` argument doesn't exist, create a new MatchAssignment with this data.
     */
    create: Prisma.XOR<Prisma.MatchAssignmentCreateInput, Prisma.MatchAssignmentUncheckedCreateInput>;
    /**
     * In case the MatchAssignment was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.MatchAssignmentUpdateInput, Prisma.MatchAssignmentUncheckedUpdateInput>;
};
/**
 * MatchAssignment delete
 */
export type MatchAssignmentDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
    /**
     * Filter which MatchAssignment to delete.
     */
    where: Prisma.MatchAssignmentWhereUniqueInput;
};
/**
 * MatchAssignment deleteMany
 */
export type MatchAssignmentDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which MatchAssignments to delete
     */
    where?: Prisma.MatchAssignmentWhereInput;
    /**
     * Limit how many MatchAssignments to delete.
     */
    limit?: number;
};
/**
 * MatchAssignment without action
 */
export type MatchAssignmentDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MatchAssignment
     */
    select?: Prisma.MatchAssignmentSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MatchAssignment
     */
    omit?: Prisma.MatchAssignmentOmit<ExtArgs> | null;
};
export {};
//# sourceMappingURL=MatchAssignment.d.ts.map