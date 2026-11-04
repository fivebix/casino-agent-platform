'use client';

import { useEffect } from 'react';
import { useGetAgentChildrenQuery } from '@/services/agentApi';
import type { UsersListQuery } from '@/types/agent';
import type { ChildrenState } from './type';

type Props = {
  agentId: string;
  query: UsersListQuery;
  onChange: (agentId: string, state: ChildrenState) => void;
};

/**
 * Renders nothing: keeps `GET /agent/users/agents/:id/children` subscribed while the agent row is expanded
 * (so it refetches when the `Users` tag is invalidated) and reports the rows up to the table.
 */
const AgentChildrenQuery = ({ agentId, query, onChange }: Props) => {
  const { currentData, isError } = useGetAgentChildrenQuery({ agentId, ...query });

  useEffect(() => {
    onChange(agentId, {
      rows: currentData?.rows,
      isLoading: !currentData && !isError,
      isError,
    });
  }, [agentId, currentData, isError, onChange]);

  return null;
};

export default AgentChildrenQuery;
