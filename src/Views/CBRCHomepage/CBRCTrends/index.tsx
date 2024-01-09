import { FetchCBRC } from '@/apiHelper/getCBRC';
import { IToken } from '@/types/CBRC';
import React, { useEffect, useState } from 'react'
import Trending from './Trending';
import { IStats } from '@/types';
import Hot from './Hot';
import TrendStats from './TrendStats';

const CBRCTrends = ({ token }: {  token:IStats }) => {
  return (
    <div className='py-6 flex flex-wrap justify-between  items-stretch w-full'>
      <div className='p-4 w-full lg:w-4/12' >
       <div>
       <TrendStats data = {token} />
       </div>
      </div>
     <div className='p-4 w-full lg:w-4/12'>
    <div>
    <Trending data = {token} />
    </div>
     </div>
     <div className='p-4 w-full lg:w-4/12'>
   <div>
   <Hot data = {token} />
   </div>
     </div>
    </div>
  )
}

export default CBRCTrends