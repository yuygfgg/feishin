import { useState } from 'react';
import { Checkbox, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { nanoid } from 'nanoid/non-secure';
import { RiInformationLine } from 'react-icons/ri';
import { ServerType } from '/@/types';
import { Button, PasswordInput, TextInput, toast } from '/@/components';
import type { ServerListItem } from '/@/store';
import { useAuthStoreActions } from '/@/store';
import { jellyfinApi } from '/@/api/jellyfin.api';
import { navidromeApi } from '/@/api/navidrome.api';
import { subsonicApi } from '/@/api/subsonic.api';
import type { AuthResponse } from '/@/api/types';

interface EditServerFormProps {
  onCancel: () => void;
  server: ServerListItem;
}

const AUTH_FUNCTIONS = {
  [ServerType.JELLYFIN]: jellyfinApi.authenticate,
  [ServerType.NAVIDROME]: navidromeApi.authenticate,
  [ServerType.SUBSONIC]: subsonicApi.authenticate,
};

export const EditServerForm = ({ server, onCancel }: EditServerFormProps) => {
  const { updateServer } = useAuthStoreActions();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      legacyAuth: false,
      name: server?.name,
      password: '',
      type: server?.type,
      url: server?.url,
      username: server?.username,
    },
  });

  const isSubsonic = form.values.type === ServerType.SUBSONIC;

  const isSubmitDisabled =
    !form.values.name || !form.values.url || !form.values.username || !form.values.password;

  const handleSubmit = form.onSubmit(async (values) => {
    const authFunction = AUTH_FUNCTIONS[values.type];

    if (!authFunction) {
      return toast.error({ message: 'Selected server type is invalid' });
    }

    try {
      setIsLoading(true);
      const data: AuthResponse = await authFunction({
        legacy: values.legacyAuth,
        password: values.password,
        url: values.url,
        username: values.username,
      });

      updateServer(server.id, {
        credential: data.credential,
        id: nanoid(),
        name: values.name,
        ndCredential: data.ndCredential,
        type: values.type,
        url: values.url,
        username: data.username,
      });

      toast.success({ message: 'Server updated' });
    } catch (err: any) {
      setIsLoading(false);
      return toast.error({ message: err?.message });
    }

    setIsLoading(false);
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          required
          label="Name"
          rightSection={form.isDirty('name') && <RiInformationLine color="red" />}
          {...form.getInputProps('name')}
        />
        <TextInput
          required
          label="Url"
          rightSection={form.isDirty('url') && <RiInformationLine color="red" />}
          {...form.getInputProps('url')}
        />
        <TextInput
          label="Username"
          rightSection={form.isDirty('username') && <RiInformationLine color="red" />}
          {...form.getInputProps('username')}
        />
        <PasswordInput
          label="Password"
          {...form.getInputProps('password')}
        />
        {isSubsonic && (
          <Checkbox
            label="Enable legacy authentication"
            {...form.getInputProps('legacyAuth', {
              type: 'checkbox',
            })}
          />
        )}
        <Group position="right">
          <Button
            variant="subtle"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitDisabled}
            loading={isLoading}
            type="submit"
            variant="filled"
          >
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
