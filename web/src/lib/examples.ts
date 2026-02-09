export const DIEHARD_CFG = `INIT Init
NEXT Next
INVARIANT TypeOK
INVARIANT NotSolved
`;

/** DieHard spec from https://github.com/tlaplus/Examples/tree/master/specifications/DieHard */
export const DIEHARD_SPEC = `------------------------------ MODULE DieHard -------------------------------
(***************************************************************************)
(* In the movie Die Hard 3, the heroes must obtain exactly 4 gallons of    *)
(* water using a 5 gallon jug, a 3 gallon jug, and a water faucet.  Our   *)
(* goal: to get TLC to solve the problem for us.                           *)
(***************************************************************************)
EXTENDS Naturals

VARIABLES big,   \\* The number of gallons of water in the 5 gallon jug.
          small  \\* The number of gallons of water in the 3 gallon jug.

TypeOK == /\\ small \\in 0..3
          /\\ big   \\in 0..5

Init == /\\ big = 0
        /\\ small = 0

FillSmallJug  == /\\ small' = 3
                 /\\ big' = big

FillBigJug    == /\\ big' = 5
                 /\\ small' = small

EmptySmallJug == /\\ small' = 0
                 /\\ big' = big

EmptyBigJug   == /\\ big' = 0
                 /\\ small' = small

Min(m,n) == IF m < n THEN m ELSE n

SmallToBig == /\\ big'   = Min(big + small, 5)
              /\\ small' = small - (big' - big)

BigToSmall == /\\ small' = Min(big + small, 3)
              /\\ big'   = big - (small' - small)

Next == \\/ FillSmallJug
        \\/ FillBigJug
        \\/ EmptySmallJug
        \\/ EmptyBigJug
        \\/ SmallToBig
        \\/ BigToSmall

Spec == Init /\\ [][Next]_<<big, small>>

NotSolved == big # 4

=============================================================================`;
