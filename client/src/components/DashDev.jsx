import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardDocumentListIcon,
  FolderIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

function DashDev({title , length , link}) {
  return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to={link}
                className="font-medium text-primary-600 hover:text-primary-500 flex items-center"
              >
                View all tasks
                <ChevronRightIcon className="ml-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
  )
}

export default DashDev