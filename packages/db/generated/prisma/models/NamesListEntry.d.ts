import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model NamesListEntry
 *
 */
export type NamesListEntryModel = runtime.Types.Result.DefaultSelection<Prisma.$NamesListEntryPayload>;
export type AggregateNamesListEntry = {
    _count: NamesListEntryCountAggregateOutputType | null;
    _avg: NamesListEntryAvgAggregateOutputType | null;
    _sum: NamesListEntrySumAggregateOutputType | null;
    _min: NamesListEntryMinAggregateOutputType | null;
    _max: NamesListEntryMaxAggregateOutputType | null;
};
export type NamesListEntryAvgAggregateOutputType = {
    sortOrder: number | null;
};
export type NamesListEntrySumAggregateOutputType = {
    sortOrder: number | null;
};
export type NamesListEntryMinAggregateOutputType = {
    id: string | null;
    namesListId: string | null;
    playerName: string | null;
    nationalityIOC: string | null;
    sortOrder: number | null;
    createdAt: Date | null;
};
export type NamesListEntryMaxAggregateOutputType = {
    id: string | null;
    namesListId: string | null;
    playerName: string | null;
    nationalityIOC: string | null;
    sortOrder: number | null;
    createdAt: Date | null;
};
export type NamesListEntryCountAggregateOutputType = {
    id: number;
    namesListId: number;
    playerName: number;
    nationalityIOC: number;
    sortOrder: number;
    createdAt: number;
    _all: number;
};
export type NamesListEntryAvgAggregateInputType = {
    sortOrder?: true;
};
export type NamesListEntrySumAggregateInputType = {
    sortOrder?: true;
};
export type NamesListEntryMinAggregateInputType = {
    id?: true;
    namesListId?: true;
    playerName?: true;
    nationalityIOC?: true;
    sortOrder?: true;
    createdAt?: true;
};
export type NamesListEntryMaxAggregateInputType = {
    id?: true;
    namesListId?: true;
    playerName?: true;
    nationalityIOC?: true;
    sortOrder?: true;
    createdAt?: true;
};
export type NamesListEntryCountAggregateInputType = {
    id?: true;
    namesListId?: true;
    playerName?: true;
    nationalityIOC?: true;
    sortOrder?: true;
    createdAt?: true;
    _all?: true;
};
export type NamesListEntryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which NamesListEntry to aggregate.
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NamesListEntries to fetch.
     */
    orderBy?: Prisma.NamesListEntryOrderByWithRelationInput | Prisma.NamesListEntryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.NamesListEntryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NamesListEntries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NamesListEntries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned NamesListEntries
    **/
    _count?: true | NamesListEntryCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: NamesListEntryAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: NamesListEntrySumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: NamesListEntryMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: NamesListEntryMaxAggregateInputType;
};
export type GetNamesListEntryAggregateType<T extends NamesListEntryAggregateArgs> = {
    [P in keyof T & keyof AggregateNamesListEntry]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateNamesListEntry[P]> : Prisma.GetScalarType<T[P], AggregateNamesListEntry[P]>;
};
export type NamesListEntryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NamesListEntryWhereInput;
    orderBy?: Prisma.NamesListEntryOrderByWithAggregationInput | Prisma.NamesListEntryOrderByWithAggregationInput[];
    by: Prisma.NamesListEntryScalarFieldEnum[] | Prisma.NamesListEntryScalarFieldEnum;
    having?: Prisma.NamesListEntryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: NamesListEntryCountAggregateInputType | true;
    _avg?: NamesListEntryAvgAggregateInputType;
    _sum?: NamesListEntrySumAggregateInputType;
    _min?: NamesListEntryMinAggregateInputType;
    _max?: NamesListEntryMaxAggregateInputType;
};
export type NamesListEntryGroupByOutputType = {
    id: string;
    namesListId: string;
    playerName: string;
    nationalityIOC: string;
    sortOrder: number;
    createdAt: Date;
    _count: NamesListEntryCountAggregateOutputType | null;
    _avg: NamesListEntryAvgAggregateOutputType | null;
    _sum: NamesListEntrySumAggregateOutputType | null;
    _min: NamesListEntryMinAggregateOutputType | null;
    _max: NamesListEntryMaxAggregateOutputType | null;
};
type GetNamesListEntryGroupByPayload<T extends NamesListEntryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<NamesListEntryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof NamesListEntryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], NamesListEntryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], NamesListEntryGroupByOutputType[P]>;
}>>;
export type NamesListEntryWhereInput = {
    AND?: Prisma.NamesListEntryWhereInput | Prisma.NamesListEntryWhereInput[];
    OR?: Prisma.NamesListEntryWhereInput[];
    NOT?: Prisma.NamesListEntryWhereInput | Prisma.NamesListEntryWhereInput[];
    id?: Prisma.StringFilter<"NamesListEntry"> | string;
    namesListId?: Prisma.StringFilter<"NamesListEntry"> | string;
    playerName?: Prisma.StringFilter<"NamesListEntry"> | string;
    nationalityIOC?: Prisma.StringFilter<"NamesListEntry"> | string;
    sortOrder?: Prisma.IntFilter<"NamesListEntry"> | number;
    createdAt?: Prisma.DateTimeFilter<"NamesListEntry"> | Date | string;
    namesList?: Prisma.XOR<Prisma.NamesListScalarRelationFilter, Prisma.NamesListWhereInput>;
};
export type NamesListEntryOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    namesListId?: Prisma.SortOrder;
    playerName?: Prisma.SortOrder;
    nationalityIOC?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    namesList?: Prisma.NamesListOrderByWithRelationInput;
};
export type NamesListEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.NamesListEntryWhereInput | Prisma.NamesListEntryWhereInput[];
    OR?: Prisma.NamesListEntryWhereInput[];
    NOT?: Prisma.NamesListEntryWhereInput | Prisma.NamesListEntryWhereInput[];
    namesListId?: Prisma.StringFilter<"NamesListEntry"> | string;
    playerName?: Prisma.StringFilter<"NamesListEntry"> | string;
    nationalityIOC?: Prisma.StringFilter<"NamesListEntry"> | string;
    sortOrder?: Prisma.IntFilter<"NamesListEntry"> | number;
    createdAt?: Prisma.DateTimeFilter<"NamesListEntry"> | Date | string;
    namesList?: Prisma.XOR<Prisma.NamesListScalarRelationFilter, Prisma.NamesListWhereInput>;
}, "id">;
export type NamesListEntryOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    namesListId?: Prisma.SortOrder;
    playerName?: Prisma.SortOrder;
    nationalityIOC?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.NamesListEntryCountOrderByAggregateInput;
    _avg?: Prisma.NamesListEntryAvgOrderByAggregateInput;
    _max?: Prisma.NamesListEntryMaxOrderByAggregateInput;
    _min?: Prisma.NamesListEntryMinOrderByAggregateInput;
    _sum?: Prisma.NamesListEntrySumOrderByAggregateInput;
};
export type NamesListEntryScalarWhereWithAggregatesInput = {
    AND?: Prisma.NamesListEntryScalarWhereWithAggregatesInput | Prisma.NamesListEntryScalarWhereWithAggregatesInput[];
    OR?: Prisma.NamesListEntryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.NamesListEntryScalarWhereWithAggregatesInput | Prisma.NamesListEntryScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"NamesListEntry"> | string;
    namesListId?: Prisma.StringWithAggregatesFilter<"NamesListEntry"> | string;
    playerName?: Prisma.StringWithAggregatesFilter<"NamesListEntry"> | string;
    nationalityIOC?: Prisma.StringWithAggregatesFilter<"NamesListEntry"> | string;
    sortOrder?: Prisma.IntWithAggregatesFilter<"NamesListEntry"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"NamesListEntry"> | Date | string;
};
export type NamesListEntryCreateInput = {
    id?: string;
    playerName: string;
    nationalityIOC?: string;
    sortOrder?: number;
    createdAt?: Date | string;
    namesList: Prisma.NamesListCreateNestedOneWithoutEntriesInput;
};
export type NamesListEntryUncheckedCreateInput = {
    id?: string;
    namesListId: string;
    playerName: string;
    nationalityIOC?: string;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type NamesListEntryUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    namesList?: Prisma.NamesListUpdateOneRequiredWithoutEntriesNestedInput;
};
export type NamesListEntryUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    namesListId?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NamesListEntryCreateManyInput = {
    id?: string;
    namesListId: string;
    playerName: string;
    nationalityIOC?: string;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type NamesListEntryUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NamesListEntryUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    namesListId?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NamesListEntryListRelationFilter = {
    every?: Prisma.NamesListEntryWhereInput;
    some?: Prisma.NamesListEntryWhereInput;
    none?: Prisma.NamesListEntryWhereInput;
};
export type NamesListEntryOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type NamesListEntryCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    namesListId?: Prisma.SortOrder;
    playerName?: Prisma.SortOrder;
    nationalityIOC?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NamesListEntryAvgOrderByAggregateInput = {
    sortOrder?: Prisma.SortOrder;
};
export type NamesListEntryMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    namesListId?: Prisma.SortOrder;
    playerName?: Prisma.SortOrder;
    nationalityIOC?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NamesListEntryMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    namesListId?: Prisma.SortOrder;
    playerName?: Prisma.SortOrder;
    nationalityIOC?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type NamesListEntrySumOrderByAggregateInput = {
    sortOrder?: Prisma.SortOrder;
};
export type NamesListEntryCreateNestedManyWithoutNamesListInput = {
    create?: Prisma.XOR<Prisma.NamesListEntryCreateWithoutNamesListInput, Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput> | Prisma.NamesListEntryCreateWithoutNamesListInput[] | Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput[];
    connectOrCreate?: Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput | Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput[];
    createMany?: Prisma.NamesListEntryCreateManyNamesListInputEnvelope;
    connect?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
};
export type NamesListEntryUncheckedCreateNestedManyWithoutNamesListInput = {
    create?: Prisma.XOR<Prisma.NamesListEntryCreateWithoutNamesListInput, Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput> | Prisma.NamesListEntryCreateWithoutNamesListInput[] | Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput[];
    connectOrCreate?: Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput | Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput[];
    createMany?: Prisma.NamesListEntryCreateManyNamesListInputEnvelope;
    connect?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
};
export type NamesListEntryUpdateManyWithoutNamesListNestedInput = {
    create?: Prisma.XOR<Prisma.NamesListEntryCreateWithoutNamesListInput, Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput> | Prisma.NamesListEntryCreateWithoutNamesListInput[] | Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput[];
    connectOrCreate?: Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput | Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput[];
    upsert?: Prisma.NamesListEntryUpsertWithWhereUniqueWithoutNamesListInput | Prisma.NamesListEntryUpsertWithWhereUniqueWithoutNamesListInput[];
    createMany?: Prisma.NamesListEntryCreateManyNamesListInputEnvelope;
    set?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    disconnect?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    delete?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    connect?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    update?: Prisma.NamesListEntryUpdateWithWhereUniqueWithoutNamesListInput | Prisma.NamesListEntryUpdateWithWhereUniqueWithoutNamesListInput[];
    updateMany?: Prisma.NamesListEntryUpdateManyWithWhereWithoutNamesListInput | Prisma.NamesListEntryUpdateManyWithWhereWithoutNamesListInput[];
    deleteMany?: Prisma.NamesListEntryScalarWhereInput | Prisma.NamesListEntryScalarWhereInput[];
};
export type NamesListEntryUncheckedUpdateManyWithoutNamesListNestedInput = {
    create?: Prisma.XOR<Prisma.NamesListEntryCreateWithoutNamesListInput, Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput> | Prisma.NamesListEntryCreateWithoutNamesListInput[] | Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput[];
    connectOrCreate?: Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput | Prisma.NamesListEntryCreateOrConnectWithoutNamesListInput[];
    upsert?: Prisma.NamesListEntryUpsertWithWhereUniqueWithoutNamesListInput | Prisma.NamesListEntryUpsertWithWhereUniqueWithoutNamesListInput[];
    createMany?: Prisma.NamesListEntryCreateManyNamesListInputEnvelope;
    set?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    disconnect?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    delete?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    connect?: Prisma.NamesListEntryWhereUniqueInput | Prisma.NamesListEntryWhereUniqueInput[];
    update?: Prisma.NamesListEntryUpdateWithWhereUniqueWithoutNamesListInput | Prisma.NamesListEntryUpdateWithWhereUniqueWithoutNamesListInput[];
    updateMany?: Prisma.NamesListEntryUpdateManyWithWhereWithoutNamesListInput | Prisma.NamesListEntryUpdateManyWithWhereWithoutNamesListInput[];
    deleteMany?: Prisma.NamesListEntryScalarWhereInput | Prisma.NamesListEntryScalarWhereInput[];
};
export type NamesListEntryCreateWithoutNamesListInput = {
    id?: string;
    playerName: string;
    nationalityIOC?: string;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type NamesListEntryUncheckedCreateWithoutNamesListInput = {
    id?: string;
    playerName: string;
    nationalityIOC?: string;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type NamesListEntryCreateOrConnectWithoutNamesListInput = {
    where: Prisma.NamesListEntryWhereUniqueInput;
    create: Prisma.XOR<Prisma.NamesListEntryCreateWithoutNamesListInput, Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput>;
};
export type NamesListEntryCreateManyNamesListInputEnvelope = {
    data: Prisma.NamesListEntryCreateManyNamesListInput | Prisma.NamesListEntryCreateManyNamesListInput[];
    skipDuplicates?: boolean;
};
export type NamesListEntryUpsertWithWhereUniqueWithoutNamesListInput = {
    where: Prisma.NamesListEntryWhereUniqueInput;
    update: Prisma.XOR<Prisma.NamesListEntryUpdateWithoutNamesListInput, Prisma.NamesListEntryUncheckedUpdateWithoutNamesListInput>;
    create: Prisma.XOR<Prisma.NamesListEntryCreateWithoutNamesListInput, Prisma.NamesListEntryUncheckedCreateWithoutNamesListInput>;
};
export type NamesListEntryUpdateWithWhereUniqueWithoutNamesListInput = {
    where: Prisma.NamesListEntryWhereUniqueInput;
    data: Prisma.XOR<Prisma.NamesListEntryUpdateWithoutNamesListInput, Prisma.NamesListEntryUncheckedUpdateWithoutNamesListInput>;
};
export type NamesListEntryUpdateManyWithWhereWithoutNamesListInput = {
    where: Prisma.NamesListEntryScalarWhereInput;
    data: Prisma.XOR<Prisma.NamesListEntryUpdateManyMutationInput, Prisma.NamesListEntryUncheckedUpdateManyWithoutNamesListInput>;
};
export type NamesListEntryScalarWhereInput = {
    AND?: Prisma.NamesListEntryScalarWhereInput | Prisma.NamesListEntryScalarWhereInput[];
    OR?: Prisma.NamesListEntryScalarWhereInput[];
    NOT?: Prisma.NamesListEntryScalarWhereInput | Prisma.NamesListEntryScalarWhereInput[];
    id?: Prisma.StringFilter<"NamesListEntry"> | string;
    namesListId?: Prisma.StringFilter<"NamesListEntry"> | string;
    playerName?: Prisma.StringFilter<"NamesListEntry"> | string;
    nationalityIOC?: Prisma.StringFilter<"NamesListEntry"> | string;
    sortOrder?: Prisma.IntFilter<"NamesListEntry"> | number;
    createdAt?: Prisma.DateTimeFilter<"NamesListEntry"> | Date | string;
};
export type NamesListEntryCreateManyNamesListInput = {
    id?: string;
    playerName: string;
    nationalityIOC?: string;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type NamesListEntryUpdateWithoutNamesListInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NamesListEntryUncheckedUpdateWithoutNamesListInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NamesListEntryUncheckedUpdateManyWithoutNamesListInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    playerName?: Prisma.StringFieldUpdateOperationsInput | string;
    nationalityIOC?: Prisma.StringFieldUpdateOperationsInput | string;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NamesListEntrySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    namesListId?: boolean;
    playerName?: boolean;
    nationalityIOC?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    namesList?: boolean | Prisma.NamesListDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["namesListEntry"]>;
export type NamesListEntrySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    namesListId?: boolean;
    playerName?: boolean;
    nationalityIOC?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    namesList?: boolean | Prisma.NamesListDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["namesListEntry"]>;
export type NamesListEntrySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    namesListId?: boolean;
    playerName?: boolean;
    nationalityIOC?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    namesList?: boolean | Prisma.NamesListDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["namesListEntry"]>;
export type NamesListEntrySelectScalar = {
    id?: boolean;
    namesListId?: boolean;
    playerName?: boolean;
    nationalityIOC?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
};
export type NamesListEntryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "namesListId" | "playerName" | "nationalityIOC" | "sortOrder" | "createdAt", ExtArgs["result"]["namesListEntry"]>;
export type NamesListEntryInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    namesList?: boolean | Prisma.NamesListDefaultArgs<ExtArgs>;
};
export type NamesListEntryIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    namesList?: boolean | Prisma.NamesListDefaultArgs<ExtArgs>;
};
export type NamesListEntryIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    namesList?: boolean | Prisma.NamesListDefaultArgs<ExtArgs>;
};
export type $NamesListEntryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "NamesListEntry";
    objects: {
        namesList: Prisma.$NamesListPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        namesListId: string;
        playerName: string;
        nationalityIOC: string;
        sortOrder: number;
        createdAt: Date;
    }, ExtArgs["result"]["namesListEntry"]>;
    composites: {};
};
export type NamesListEntryGetPayload<S extends boolean | null | undefined | NamesListEntryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload, S>;
export type NamesListEntryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<NamesListEntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: NamesListEntryCountAggregateInputType | true;
};
export interface NamesListEntryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['NamesListEntry'];
        meta: {
            name: 'NamesListEntry';
        };
    };
    /**
     * Find zero or one NamesListEntry that matches the filter.
     * @param {NamesListEntryFindUniqueArgs} args - Arguments to find a NamesListEntry
     * @example
     * // Get one NamesListEntry
     * const namesListEntry = await prisma.namesListEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NamesListEntryFindUniqueArgs>(args: Prisma.SelectSubset<T, NamesListEntryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one NamesListEntry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NamesListEntryFindUniqueOrThrowArgs} args - Arguments to find a NamesListEntry
     * @example
     * // Get one NamesListEntry
     * const namesListEntry = await prisma.namesListEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NamesListEntryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, NamesListEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first NamesListEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryFindFirstArgs} args - Arguments to find a NamesListEntry
     * @example
     * // Get one NamesListEntry
     * const namesListEntry = await prisma.namesListEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NamesListEntryFindFirstArgs>(args?: Prisma.SelectSubset<T, NamesListEntryFindFirstArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first NamesListEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryFindFirstOrThrowArgs} args - Arguments to find a NamesListEntry
     * @example
     * // Get one NamesListEntry
     * const namesListEntry = await prisma.namesListEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NamesListEntryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, NamesListEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more NamesListEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NamesListEntries
     * const namesListEntries = await prisma.namesListEntry.findMany()
     *
     * // Get first 10 NamesListEntries
     * const namesListEntries = await prisma.namesListEntry.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const namesListEntryWithIdOnly = await prisma.namesListEntry.findMany({ select: { id: true } })
     *
     */
    findMany<T extends NamesListEntryFindManyArgs>(args?: Prisma.SelectSubset<T, NamesListEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a NamesListEntry.
     * @param {NamesListEntryCreateArgs} args - Arguments to create a NamesListEntry.
     * @example
     * // Create one NamesListEntry
     * const NamesListEntry = await prisma.namesListEntry.create({
     *   data: {
     *     // ... data to create a NamesListEntry
     *   }
     * })
     *
     */
    create<T extends NamesListEntryCreateArgs>(args: Prisma.SelectSubset<T, NamesListEntryCreateArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many NamesListEntries.
     * @param {NamesListEntryCreateManyArgs} args - Arguments to create many NamesListEntries.
     * @example
     * // Create many NamesListEntries
     * const namesListEntry = await prisma.namesListEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends NamesListEntryCreateManyArgs>(args?: Prisma.SelectSubset<T, NamesListEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many NamesListEntries and returns the data saved in the database.
     * @param {NamesListEntryCreateManyAndReturnArgs} args - Arguments to create many NamesListEntries.
     * @example
     * // Create many NamesListEntries
     * const namesListEntry = await prisma.namesListEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many NamesListEntries and only return the `id`
     * const namesListEntryWithIdOnly = await prisma.namesListEntry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends NamesListEntryCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, NamesListEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a NamesListEntry.
     * @param {NamesListEntryDeleteArgs} args - Arguments to delete one NamesListEntry.
     * @example
     * // Delete one NamesListEntry
     * const NamesListEntry = await prisma.namesListEntry.delete({
     *   where: {
     *     // ... filter to delete one NamesListEntry
     *   }
     * })
     *
     */
    delete<T extends NamesListEntryDeleteArgs>(args: Prisma.SelectSubset<T, NamesListEntryDeleteArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one NamesListEntry.
     * @param {NamesListEntryUpdateArgs} args - Arguments to update one NamesListEntry.
     * @example
     * // Update one NamesListEntry
     * const namesListEntry = await prisma.namesListEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends NamesListEntryUpdateArgs>(args: Prisma.SelectSubset<T, NamesListEntryUpdateArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more NamesListEntries.
     * @param {NamesListEntryDeleteManyArgs} args - Arguments to filter NamesListEntries to delete.
     * @example
     * // Delete a few NamesListEntries
     * const { count } = await prisma.namesListEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends NamesListEntryDeleteManyArgs>(args?: Prisma.SelectSubset<T, NamesListEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more NamesListEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NamesListEntries
     * const namesListEntry = await prisma.namesListEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends NamesListEntryUpdateManyArgs>(args: Prisma.SelectSubset<T, NamesListEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more NamesListEntries and returns the data updated in the database.
     * @param {NamesListEntryUpdateManyAndReturnArgs} args - Arguments to update many NamesListEntries.
     * @example
     * // Update many NamesListEntries
     * const namesListEntry = await prisma.namesListEntry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more NamesListEntries and only return the `id`
     * const namesListEntryWithIdOnly = await prisma.namesListEntry.updateManyAndReturn({
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
    updateManyAndReturn<T extends NamesListEntryUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, NamesListEntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one NamesListEntry.
     * @param {NamesListEntryUpsertArgs} args - Arguments to update or create a NamesListEntry.
     * @example
     * // Update or create a NamesListEntry
     * const namesListEntry = await prisma.namesListEntry.upsert({
     *   create: {
     *     // ... data to create a NamesListEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NamesListEntry we want to update
     *   }
     * })
     */
    upsert<T extends NamesListEntryUpsertArgs>(args: Prisma.SelectSubset<T, NamesListEntryUpsertArgs<ExtArgs>>): Prisma.Prisma__NamesListEntryClient<runtime.Types.Result.GetResult<Prisma.$NamesListEntryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of NamesListEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryCountArgs} args - Arguments to filter NamesListEntries to count.
     * @example
     * // Count the number of NamesListEntries
     * const count = await prisma.namesListEntry.count({
     *   where: {
     *     // ... the filter for the NamesListEntries we want to count
     *   }
     * })
    **/
    count<T extends NamesListEntryCountArgs>(args?: Prisma.Subset<T, NamesListEntryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], NamesListEntryCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a NamesListEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NamesListEntryAggregateArgs>(args: Prisma.Subset<T, NamesListEntryAggregateArgs>): Prisma.PrismaPromise<GetNamesListEntryAggregateType<T>>;
    /**
     * Group by NamesListEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NamesListEntryGroupByArgs} args - Group by arguments.
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
    groupBy<T extends NamesListEntryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: NamesListEntryGroupByArgs['orderBy'];
    } : {
        orderBy?: NamesListEntryGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, NamesListEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNamesListEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the NamesListEntry model
     */
    readonly fields: NamesListEntryFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for NamesListEntry.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__NamesListEntryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    namesList<T extends Prisma.NamesListDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.NamesListDefaultArgs<ExtArgs>>): Prisma.Prisma__NamesListClient<runtime.Types.Result.GetResult<Prisma.$NamesListPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the NamesListEntry model
 */
export interface NamesListEntryFieldRefs {
    readonly id: Prisma.FieldRef<"NamesListEntry", 'String'>;
    readonly namesListId: Prisma.FieldRef<"NamesListEntry", 'String'>;
    readonly playerName: Prisma.FieldRef<"NamesListEntry", 'String'>;
    readonly nationalityIOC: Prisma.FieldRef<"NamesListEntry", 'String'>;
    readonly sortOrder: Prisma.FieldRef<"NamesListEntry", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"NamesListEntry", 'DateTime'>;
}
/**
 * NamesListEntry findUnique
 */
export type NamesListEntryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * Filter, which NamesListEntry to fetch.
     */
    where: Prisma.NamesListEntryWhereUniqueInput;
};
/**
 * NamesListEntry findUniqueOrThrow
 */
export type NamesListEntryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * Filter, which NamesListEntry to fetch.
     */
    where: Prisma.NamesListEntryWhereUniqueInput;
};
/**
 * NamesListEntry findFirst
 */
export type NamesListEntryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * Filter, which NamesListEntry to fetch.
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NamesListEntries to fetch.
     */
    orderBy?: Prisma.NamesListEntryOrderByWithRelationInput | Prisma.NamesListEntryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for NamesListEntries.
     */
    cursor?: Prisma.NamesListEntryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NamesListEntries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NamesListEntries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NamesListEntries.
     */
    distinct?: Prisma.NamesListEntryScalarFieldEnum | Prisma.NamesListEntryScalarFieldEnum[];
};
/**
 * NamesListEntry findFirstOrThrow
 */
export type NamesListEntryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * Filter, which NamesListEntry to fetch.
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NamesListEntries to fetch.
     */
    orderBy?: Prisma.NamesListEntryOrderByWithRelationInput | Prisma.NamesListEntryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for NamesListEntries.
     */
    cursor?: Prisma.NamesListEntryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NamesListEntries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NamesListEntries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NamesListEntries.
     */
    distinct?: Prisma.NamesListEntryScalarFieldEnum | Prisma.NamesListEntryScalarFieldEnum[];
};
/**
 * NamesListEntry findMany
 */
export type NamesListEntryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * Filter, which NamesListEntries to fetch.
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NamesListEntries to fetch.
     */
    orderBy?: Prisma.NamesListEntryOrderByWithRelationInput | Prisma.NamesListEntryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing NamesListEntries.
     */
    cursor?: Prisma.NamesListEntryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NamesListEntries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NamesListEntries.
     */
    skip?: number;
    distinct?: Prisma.NamesListEntryScalarFieldEnum | Prisma.NamesListEntryScalarFieldEnum[];
};
/**
 * NamesListEntry create
 */
export type NamesListEntryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * The data needed to create a NamesListEntry.
     */
    data: Prisma.XOR<Prisma.NamesListEntryCreateInput, Prisma.NamesListEntryUncheckedCreateInput>;
};
/**
 * NamesListEntry createMany
 */
export type NamesListEntryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many NamesListEntries.
     */
    data: Prisma.NamesListEntryCreateManyInput | Prisma.NamesListEntryCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * NamesListEntry createManyAndReturn
 */
export type NamesListEntryCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * The data used to create many NamesListEntries.
     */
    data: Prisma.NamesListEntryCreateManyInput | Prisma.NamesListEntryCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * NamesListEntry update
 */
export type NamesListEntryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * The data needed to update a NamesListEntry.
     */
    data: Prisma.XOR<Prisma.NamesListEntryUpdateInput, Prisma.NamesListEntryUncheckedUpdateInput>;
    /**
     * Choose, which NamesListEntry to update.
     */
    where: Prisma.NamesListEntryWhereUniqueInput;
};
/**
 * NamesListEntry updateMany
 */
export type NamesListEntryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update NamesListEntries.
     */
    data: Prisma.XOR<Prisma.NamesListEntryUpdateManyMutationInput, Prisma.NamesListEntryUncheckedUpdateManyInput>;
    /**
     * Filter which NamesListEntries to update
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * Limit how many NamesListEntries to update.
     */
    limit?: number;
};
/**
 * NamesListEntry updateManyAndReturn
 */
export type NamesListEntryUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * The data used to update NamesListEntries.
     */
    data: Prisma.XOR<Prisma.NamesListEntryUpdateManyMutationInput, Prisma.NamesListEntryUncheckedUpdateManyInput>;
    /**
     * Filter which NamesListEntries to update
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * Limit how many NamesListEntries to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * NamesListEntry upsert
 */
export type NamesListEntryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * The filter to search for the NamesListEntry to update in case it exists.
     */
    where: Prisma.NamesListEntryWhereUniqueInput;
    /**
     * In case the NamesListEntry found by the `where` argument doesn't exist, create a new NamesListEntry with this data.
     */
    create: Prisma.XOR<Prisma.NamesListEntryCreateInput, Prisma.NamesListEntryUncheckedCreateInput>;
    /**
     * In case the NamesListEntry was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.NamesListEntryUpdateInput, Prisma.NamesListEntryUncheckedUpdateInput>;
};
/**
 * NamesListEntry delete
 */
export type NamesListEntryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
    /**
     * Filter which NamesListEntry to delete.
     */
    where: Prisma.NamesListEntryWhereUniqueInput;
};
/**
 * NamesListEntry deleteMany
 */
export type NamesListEntryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which NamesListEntries to delete
     */
    where?: Prisma.NamesListEntryWhereInput;
    /**
     * Limit how many NamesListEntries to delete.
     */
    limit?: number;
};
/**
 * NamesListEntry without action
 */
export type NamesListEntryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NamesListEntry
     */
    select?: Prisma.NamesListEntrySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the NamesListEntry
     */
    omit?: Prisma.NamesListEntryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.NamesListEntryInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=NamesListEntry.d.ts.map