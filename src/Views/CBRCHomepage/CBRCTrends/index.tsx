import { FetchCBRC } from '@/apiHelper/getCBRC';
import { IToken } from '@/types/CBRC';
import React, { useEffect, useState } from 'react'
import Trending from './Trending';
import { IStats } from '@/types';
import Hot from './Hot';

const CBRCTrends = ({ token }: {  token:IStats }) => {
  return (
    <div className='py-6 flex flex-wrap justify-between items-center w-full'>
     <div className=' w-full lg:w-4/12'>
     <Trending data = {token.tokensTrend} />
     </div>
     <div className=' w-full lg:w-4/12'>
     <Hot data = {token.tokensHot} />
     </div>
    </div>
  )
}

export default CBRCTrends